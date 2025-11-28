import asyncio
from bleak import BleakScanner, BleakClient
import numpy as np


# Add all relevant UUIDs (standard and WHOOP custom)
WHOOP_SERVICE_UUID = "FD4B0001-CCE1-4033-93CE-002D5875F58A"
WHOOP_NOTIFY_UUIDS = [
    "FD4B0003-CCE1-4033-93CE-002D5875F58A",
    "FD4B0005-CCE1-4033-93CE-002D5875F58A",
    "FD4B0007-CCE1-4033-93CE-002D5875F58A"
]
HR_SERVICE_UUID = "180D"
HR_CHAR_UUID = "00002A37-0000-1000-8000-00805f9b34fb"

WHOOP_NAME = "WHOOP DIMI"  # Use the name as broadcasted

# Store session data
hr_list = []
rr_list = []

def parse_hr_packet(data):
    flags = data[0]
    pos = 1

    # Heart Rate value (8 or 16 bits)
    if flags & 0x01:
        hr_value = int.from_bytes(data[pos:pos+2], "little")
        pos += 2
    else:
        hr_value = data[pos]
        pos += 1
    hr_list.append(hr_value)
    print("Heart Rate:", hr_value)

    # RR-intervals
    if flags & 0x10:
        while pos + 1 < len(data):
            rr = int.from_bytes(data[pos:pos+2], "little") / 1024
            rr_list.append(rr)
            pos += 2
        print("RR Intervals (s):", rr_list[-1:])

def print_stats():
    if hr_list:
        print(f"\nSession Heart Rate Stats:")
        print(f"  Min HR:   {min(hr_list)} bpm")
        print(f"  Max HR:   {max(hr_list)} bpm")
        print(f"  Mean HR:  {np.mean(hr_list):.2f} bpm")

    if len(rr_list) > 1:
        rr_ms = [x * 1000 for x in rr_list]  # ms
        diffs = np.diff(rr_ms)
        rmssd = np.sqrt(np.mean(diffs**2))
        print(f"  RMSSD (HRV): {rmssd:.2f} ms")
    else:
        print("Not enough RR data for HRV stats.")

async def main():
    print("Scanning for WHOOP...")
    devices = await BleakScanner.discover()
    target = next((d for d in devices if WHOOP_NAME in (d.name or "")), None)
    if not target:
        print("WHOOP not found.")
        return

    print("Connecting to", target.address)
    async with BleakClient(target.address) as client:
        print("Connected:", client.is_connected)

        def hr_handler(_, data):
            parse_hr_packet(bytearray(data))

        try:
            await client.start_notify(HR_CHAR_UUID, hr_handler)
            print(f"Subscribed to HR characteristic {HR_CHAR_UUID}")
        except Exception as e:
            print("HR characteristic not found or subscribe failed:", e)

        print("Sniffing notifications... (Ctrl+C to stop)")
        try:
            # Collect for ~60 seconds (customize as needed)
            for _ in range(60):
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("Stopped by user.")

        print_stats()  # Show session summary

asyncio.run(main())
