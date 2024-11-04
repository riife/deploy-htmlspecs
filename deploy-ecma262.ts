import { $, Glob } from "bun";
import fs from "node:fs";
import path from "node:path";

const DIR = "ecma262";

await updateGit();
await replaceUrls();
await xmit();

async function refactorFile(filepath: string, cb: (text: string) => string) {
    const file = Bun.file(filepath);
    const text = await file.text();
    const replaced = cb(text);
    return Bun.write(filepath, replaced);
}

async function updateGit() {
    if (fs.existsSync(path.resolve(DIR, ".git"))) {
        await $`cd ${DIR} && git pull`;
    } else {
        await $`git clone https://github.com/JinDX/ecma262.com ${DIR} --depth=1`;
    }
}

async function replaceUrls() {
    const glob = new Glob(`${DIR}/**/*`);
    for await (const filepath of glob.scan(".")) {
        refactorFile(filepath, (text) =>
            text
                .replaceAll("https://htmlspecs.com/", "https://html.yieldray.fun/")
                .replaceAll("https://ecma262.com/", "https://ecma262.yieldray.fun")
        );
    }
}

async function xmit() {
    fs.rmSync(path.resolve(DIR, "README.md"));
    fs.rmSync(path.resolve(DIR, "index.html"));
    fs.rmSync(path.resolve(DIR, "_redirects"));
    return Bun.write(
        path.resolve(DIR, "xmit.toml"),
        `\
[[redirects]]
from = "/"
to = "/2024/"

[[headers]]
name = "access-control-allow-origin"
value = "*"

[[headers]]
name = "referrer-policy"

[[headers]]
name = "x-frame-options"

[[headers]]
name = "x-content-type-options"

[[headers]]
name = "server"`
    );
}
