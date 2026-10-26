"""One YouTube transcript via youtube-transcript-api (free provider of the yt-transcripts collector).

Usage: python -I fetch_transcript.py <video_id>
Prints one JSON line: {"status": "ok"|"no-captions"|"blocked"|"failed", "kind", "language", "text", "duration_s", "error"}.
Manual English captions are preferred over generated ones; any other language is taken when English is missing.
Exit code is always 0 when JSON was printed; the caller decides from "status".
"""
import json
import sys

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api import _errors as E
except Exception as exc:  # library missing in the venv
    print(json.dumps({"status": "failed", "error": f"youtube-transcript-api not available: {exc}"}))
    sys.exit(0)

BLOCKED = tuple(c for c in (getattr(E, "RequestBlocked", None), getattr(E, "IpBlocked", None)) if c)
NO_CAPTIONS = tuple(
    c for c in (getattr(E, "TranscriptsDisabled", None), getattr(E, "NoTranscriptFound", None), getattr(E, "VideoUnavailable", None)) if c
)


def proxy_config():
    """Proxy from env (secrets.env via after.mjs): Webshare residential (WEBSHARE_PROXY_USERNAME/PASSWORD,
    recommended by the library) or any HTTP(S) proxy (YT_PROXY_URL). None = direct (blocked from this server)."""
    import os
    from youtube_transcript_api.proxies import GenericProxyConfig, WebshareProxyConfig

    user, pwd = os.environ.get("WEBSHARE_PROXY_USERNAME"), os.environ.get("WEBSHARE_PROXY_PASSWORD")
    if user and pwd:
        return WebshareProxyConfig(proxy_username=user, proxy_password=pwd)
    url = os.environ.get("YT_PROXY_URL")
    if url:
        return GenericProxyConfig(http_url=url, https_url=url)
    return None


def main(video_id: str) -> dict:
    api = YouTubeTranscriptApi(proxy_config=proxy_config())
    try:
        listing = api.list(video_id)
        try:
            tr = listing.find_manually_created_transcript(["en"])
        except Exception:
            try:
                tr = listing.find_generated_transcript(["en"])
            except Exception:
                tr = next(iter(listing))
        fetched = tr.fetch()
        snippets = fetched.snippets
        text = " ".join(s.text.replace("\n", " ") for s in snippets)
        duration = round(snippets[-1].start + snippets[-1].duration) if snippets else None
        return {
            "status": "ok",
            "kind": "auto" if tr.is_generated else "manual",
            "language": tr.language_code,
            "text": text,
            "duration_s": duration,
        }
    except BLOCKED as exc:
        return {"status": "blocked", "error": type(exc).__name__}
    except NO_CAPTIONS as exc:
        return {"status": "no-captions", "error": type(exc).__name__}
    except StopIteration:
        return {"status": "no-captions", "error": "empty transcript list"}
    except Exception as exc:  # network, parsing, YouTube changes
        return {"status": "failed", "error": f"{type(exc).__name__}: {str(exc)[:300]}"}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"status": "failed", "error": "usage: fetch_transcript.py <video_id>"}))
    else:
        print(json.dumps(main(sys.argv[1]), ensure_ascii=False))
