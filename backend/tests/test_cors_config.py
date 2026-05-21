import sys
from pathlib import Path
from unittest import TestCase

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import DEFAULT_ALLOWED_ORIGINS, build_allowed_origins


class CorsConfigTests(TestCase):
    def test_default_vercel_origin_matches_browser_origin(self) -> None:
        self.assertEqual(
            build_allowed_origins(DEFAULT_ALLOWED_ORIGINS),
            ["https://jarvisss.vercel.app", "null"],
        )

    def test_trailing_slashes_are_removed_from_origin_env_values(self) -> None:
        self.assertEqual(
            build_allowed_origins("https://jarvisss.vercel.app/,null"),
            ["https://jarvisss.vercel.app", "null"],
        )

    def test_duplicate_origins_are_removed_after_normalization(self) -> None:
        self.assertEqual(
            build_allowed_origins(
                "https://jarvisss.vercel.app/, https://jarvisss.vercel.app"
            ),
            ["https://jarvisss.vercel.app"],
        )
