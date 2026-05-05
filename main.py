import asyncio
import base64
import json
import websockets
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

# Track if a function call is in progress
active_function_call = False

def sts_connect():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise Exception("DEEPGRAM_API_KEY not found")

    sts_ws = websockets.connect(
        "wss://agent.deepgram.com/v1/agent/converse",
        subprotocols=["token", api_key]
    )

    return sts_ws


def load_config():
    with open("config.json", "r") as f:
        return json.load(f)


async def handle_function_call(func, sts_ws, session_id):
    global active_function_call
    active_function_call = True

    func_name = func.get("name")
    func_args = json.loads(func.get("arguments", "{}"))

    print(f"Function called: {func_name} with args: {func_args}")

    result = {}

    if func_name == "get_menu":
        from tools.menu_tools import get_menu
        result = await get_menu()

    elif func_name == "add_item":
        from tools.order_tools import add_item
        result = await add_item(
            session_id=session_id,
            item_name=func_args.get("item_name", ""),
            quantity=func_args.get("quantity", 1),
            customizations=func_args.get("customizations", {})
        )

    elif func_name == "get_order_summary":
        from tools.order_tools import get_order_summary
        result = await get_order_summary(session_id=session_id)

    elif func_name == "place_order":
        from tools.order_tools import place_order
        result = await place_order(
            session_id=session_id,
            phone_number=func_args.get("phone_number", "")
        )

    else:
        result = {"error": f"Unknown function: {func_name}"}

    # function_response = {
    #     "type": "FunctionCallResponse",
    #     "function_call_id": func.get("id"),
    #     "output": json.dumps(result)
    # }
    function_response = {
        "type": "FunctionCallResponse",
        "id": func.get("id"),
        "name": func_name,           # ← add name
        "content": json.dumps(result) # ← was "output"
    }
    await sts_ws.send(json.dumps(function_response))
    print(f"Function response sent: {result}")

    active_function_call = False


async def handle_text_message(decoded, twilio_ws, sts_ws, streamsid, session_id):
    global active_function_call
    msg_type = decoded.get("type")

    if msg_type == "UserStartedSpeaking":
        if not active_function_call:
            clear_message = {
                "event": "clear",
                "streamSid": streamsid
            }
            await twilio_ws.send(json.dumps(clear_message))

    elif msg_type == "FunctionCallRequest":
        functions = decoded.get("functions", [])
        for func in functions:
            await handle_function_call(func, sts_ws, session_id)


async def sts_sender(sts_ws, audio_queue):
    print("sts_sender started")
    while True:
        chunk = await audio_queue.get()
        await sts_ws.send(chunk)


async def sts_receiver(sts_ws, twilio_ws, streamsid_queue, session_id):
    print("sts_receiver started")
    streamsid = await streamsid_queue.get()
    async for message in sts_ws:
        if type(message) is str:
            print(message)
            decoded = json.loads(message)
            await handle_text_message(decoded, twilio_ws, sts_ws, streamsid, session_id)
            continue
        raw_mulaw = message
        media_message = {
            "event": "media",
            "streamSid": streamsid,
            "media": {"payload": base64.b64encode(raw_mulaw).decode("ascii")}
        }
        await twilio_ws.send(json.dumps(media_message))


async def twilio_receiver(twilio_ws, audio_queue, streamsid_queue):
    BUFFER_SIZE = 20 * 160
    inbuffer = bytearray(b"")
    async for message in twilio_ws:
        try:
            data = json.loads(message)
            event = data["event"]
            if event == "start":
                print("got streamsid")
                streamsid = data["start"]["streamSid"]
                streamsid_queue.put_nowait(streamsid)
            elif event == "connected":
                continue
            elif event == "media":
                media = data["media"]
                chunk = base64.b64decode(media["payload"])
                if media["track"] == "inbound":
                    inbuffer.extend(chunk)
            elif event == "stop":
                break

            while len(inbuffer) >= BUFFER_SIZE:
                chunk = bytes(inbuffer[:BUFFER_SIZE])
                audio_queue.put_nowait(chunk)
                inbuffer = inbuffer[BUFFER_SIZE:]

        except Exception as e:
            print(f"twilio_receiver error: {e}")
            break


async def twilio_handler(twilio_ws):
    audio_queue = asyncio.Queue()
    streamsid_queue = asyncio.Queue()
    session_id = str(uuid.uuid4())

    async with sts_connect() as sts_ws:
        config_message = load_config()
        await sts_ws.send(json.dumps(config_message))

        await asyncio.gather(
            sts_sender(sts_ws, audio_queue),
            sts_receiver(sts_ws, twilio_ws, streamsid_queue, session_id),
            twilio_receiver(twilio_ws, audio_queue, streamsid_queue),
        )

        await twilio_ws.close()


async def main():
    async with websockets.serve(twilio_handler, "localhost", 5000):
        print("Started server.")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())