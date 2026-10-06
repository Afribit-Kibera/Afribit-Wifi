"""Send one OpenDHT protocol ping; no account or message data is used."""
import argparse
import json
import os
import socket

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--host", default="10.20.0.10")
parser.add_argument("--bind", required=True)
args = parser.parse_args()
# OpenDHT network_engine.cpp sendPing: a.id, q=ping, t, y=q, v=o2.
packet = (b"\x85\xa1a\x81\xa2id\xc4\x14" + os.urandom(20)
          + b"\xa1q\xa4ping\xa1t\x1f\xa1y\xa1q\xa1v\xa2o2")
with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
    connection.bind((args.bind, 0))
    connection.settimeout(5)
    connection.sendto(packet, (args.host, 4222))
    reply, source = connection.recvfrom(65535)
    # sendPong packs a four-entry map, r.id/sa, matching t, y=r and v.
    valid = (source == (args.host, 4222)
             and reply.startswith(b"\x84\xa1r\x82\xa2id\xc4\x14")
             and b"\xa1t\x1f" in reply and b"\xa1y\xa1r" in reply)
    print(json.dumps({"protocol": "OpenDHT UDP ping", "reachable": valid,
                      "source": source[0], "port": source[1], "replyBytes": len(reply)}))
    if not valid:
        raise SystemExit("Reply did not match the expected OpenDHT pong")
