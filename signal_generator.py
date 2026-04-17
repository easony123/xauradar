"""
Compatibility wrapper.
Keeps existing workflow entrypoint while delegating to the upgraded engine.
"""

from signal_engine_v2 import run_signal_engine


if __name__ == "__main__":
    run_signal_engine()
