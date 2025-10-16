#!/usr/bin/env python3

import base64
import json
import os
import sys
from urllib import request, error, parse


def fail(message: str, exit_code: int = 1) -> None:
	sys.stderr.write(message + "\n")
	sys.exit(exit_code)


def get_env(name: str) -> str:
	value = os.getenv(name)
	if not value:
		fail(f"Missing required environment variable: {name}")
	return value


def http_put(url: str, payload: dict, token: str) -> request.addinfourl:
	data = json.dumps(payload).encode("utf-8")
	req = request.Request(url=url, data=data, method="PUT")
	req.add_header("Authorization", f"Bearer {token}")
	req.add_header("Accept", "application/vnd.github+json")
	req.add_header("Content-Type", "application/json")
	req.add_header("User-Agent", "image-uploader-script")
	return request.urlopen(req)


def http_get(url: str, token: str) -> request.addinfourl:
	req = request.Request(url=url, method="GET")
	req.add_header("Authorization", f"Bearer {token}")
	req.add_header("Accept", "application/vnd.github+json")
	req.add_header("User-Agent", "image-uploader-script")
	return request.urlopen(req)


def upload_image(image_path: str) -> None:
	owner = get_env("OWNER")
	repo = get_env("REPO")
	branch = get_env("BRANCH")
	token = get_env("GITHUB_TOKEN")

	if not os.path.isfile(image_path):
		fail(f"File not found: {image_path}")

	filename = os.path.basename(image_path)
	with open(image_path, "rb") as f:
		image_bytes = f.read()

	b64_content = base64.b64encode(image_bytes).decode("ascii")
	path_in_repo = f"uploads/{filename}"
	api_base = f"https://api.github.com/repos/{owner}/{repo}/contents/"
	encoded_repo_path = parse.quote(path_in_repo, safe="/")
	resource_url = api_base + encoded_repo_path

	payload = {
		"message": f"Upload {filename}",
		"content": b64_content,
		"branch": branch,
	}

	try:
		resp = http_put(resource_url, payload, token)
		# 201 Created (new) or 200 OK (updated) are both success
		if resp.status in (200, 201):
			raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{parse.quote('uploads/' + filename, safe='/')}"
			print(raw_url)
			return
		else:
			# Unexpected status; try to read error message
			body = resp.read().decode("utf-8", errors="ignore")
			fail(f"Unexpected response status {resp.status}: {body}")
	except error.HTTPError as e:
		# If file exists (422), fetch sha and retry with sha
		if e.code == 422:
			try:
				get_url = resource_url + f"?ref={parse.quote(branch)}"
				get_resp = http_get(get_url, token)
				metadata = json.loads(get_resp.read().decode("utf-8"))
				sha = metadata.get("sha")
				if not sha:
					fail("Could not retrieve existing file sha for update")

				payload_with_sha = dict(payload)
				payload_with_sha["sha"] = sha
				retry_resp = http_put(resource_url, payload_with_sha, token)
				if retry_resp.status in (200, 201):
					raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{parse.quote('uploads/' + filename, safe='/')}"
					print(raw_url)
					return
				else:
					body = retry_resp.read().decode("utf-8", errors="ignore")
					fail(f"Unexpected response status {retry_resp.status}: {body}")
			except error.HTTPError as inner:
				body = inner.read().decode("utf-8", errors="ignore")
				fail(f"GitHub API error {inner.code}: {body}")
			except Exception as inner_e:
				fail(str(inner_e))
		else:
			body = e.read().decode("utf-8", errors="ignore")
			fail(f"GitHub API error {e.code}: {body}")
	except Exception as e:
		fail(str(e))


def main() -> None:
	if len(sys.argv) != 2:
		fail("Usage: upload_image_to_github.py /absolute/path/to/image")
	upload_image(sys.argv[1])


if __name__ == "__main__":
	main()