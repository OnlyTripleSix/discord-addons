"""Publish the checked-in client packages as one GitHub release."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_REPOSITORY = "OnlyTripleSix/discord-addons"


def checked_manifest():
    manifest = json.loads((ROOT / ".release/current.json").read_text())
    if manifest["repository"] != EXPECTED_REPOSITORY:
        raise ValueError("Unexpected release repository")
    if not manifest["tag"].startswith("plugins-"):
        raise ValueError("Unexpected release tag")
    names = set()
    for asset in manifest["assets"]:
        target = (ROOT / asset["path"]).resolve()
        if not target.is_relative_to(ROOT) or not target.is_file():
            raise ValueError("Invalid release asset path")
        if Path(asset["name"]).name != asset["name"] or asset["name"] in names:
            raise ValueError("Invalid or repeated release asset name")
        names.add(asset["name"])
        if hashlib.sha256(target.read_bytes()).hexdigest() != asset["sha256"]:
            raise ValueError("Release asset checksum mismatch: " + asset["name"])
    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = checked_manifest()
    if args.check:
        print("Verified", len(manifest["assets"]), "release assets")
        return
    if os.environ.get("GITHUB_REPOSITORY") != EXPECTED_REPOSITORY:
        raise ValueError("Publishing is limited to the expected repository")
    token = os.environ["GITHUB_TOKEN"]
    base = "https://api.github.com/repos/" + EXPECTED_REPOSITORY

    def request(method, url, payload=None, raw=None, content_type="application/json", missing_ok=False):
        data = raw if raw is not None else None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": content_type,
            "User-Agent": "discord-addons-release",
        })
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                result = response.read()
                return json.loads(result) if result else None
        except urllib.error.HTTPError as error:
            if missing_ok and error.code == 404:
                return None
            detail = error.read().decode(errors="replace")[:2000]
            raise RuntimeError(f"GitHub returned {error.code}: {detail}") from None

    release = request("GET", base + "/releases/tags/" + urllib.parse.quote(manifest["tag"], safe=""), missing_ok=True)
    if release is None:
        release = request("POST", base + "/releases", {
            "tag_name": manifest["tag"], "target_commitish": os.environ["GITHUB_SHA"],
            "name": manifest["name"], "body": manifest["body"], "draft": True, "prerelease": False,
        })
    upload_base = release["upload_url"].split("{")[0]
    existing = {asset["name"]: asset for asset in request("GET", base + f"/releases/{release['id']}/assets?per_page=100")}
    for asset in manifest["assets"]:
        old = existing.get(asset["name"])
        if old and old.get("digest") == "sha256:" + asset["sha256"]:
            print("Verified existing asset:", asset["name"])
            continue
        if old:
            request("DELETE", base + f"/releases/assets/{old['id']}")
        uploaded = request("POST", upload_base + "?" + urllib.parse.urlencode({"name": asset["name"]}),
                           raw=(ROOT / asset["path"]).read_bytes(), content_type=asset["content_type"])
        if uploaded.get("digest") and uploaded["digest"] != "sha256:" + asset["sha256"]:
            raise ValueError("Uploaded asset checksum mismatch")
        print("Uploaded:", uploaded["name"])
    release = request("PATCH", base + f"/releases/{release['id']}", {
        "name": manifest["name"], "body": manifest["body"], "draft": False, "prerelease": False, "make_latest": "true",
    })
    for tag in manifest.get("retire_release_tags", []):
        if tag == manifest["tag"]:
            raise ValueError("Cannot retire the active release")
        old = request("GET", base + "/releases/tags/" + urllib.parse.quote(tag, safe=""), missing_ok=True)
        if old:
            request("DELETE", base + f"/releases/{old['id']}")
            print("Retired archived release page:", tag)
    print("Published:", release["html_url"])


if __name__ == "__main__":
    main()
