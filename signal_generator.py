"""
Compatibility wrapper.
Keeps existing workflow entrypoint while delegating to the upgraded engine.
"""

import sys

from signal_engine_v2 import run_demo_trade_backfill, run_signal_engine


if __name__ == "__main__":
    if "--backfill-demo-trades" in sys.argv:
        run_demo_trade_backfill()
    else:
        run_signal_engine()
