import { $, Glob } from "bun";
import fs from "node:fs";
import path from "node:path";

const DIR = "htmlspecs";

console.time(DIR);
await updateGit();
await refactorFile(path.resolve(DIR, "dropdown.js"), (text) => {
    return text
        .replace(
            `window.location.hostname === 'ecma262.com'`,
            `window.location.hostname.startsWith('ecma262.')`
        )
        .replace(/\W\(function \(\) \{\W+var gaID;[\s\S]*?\}\)\(\);\W/g, "");
});
await replaceUrls();
await xmit();
console.timeEnd(DIR);

async function refactorFile(filepath: string, cb: (text: string) => string) {
    const file = Bun.file(filepath);
    const text = await file.text();
    const replaced = cb(text);
    return Bun.write(filepath, replaced);
}

async function updateGit() {
    if (fs.existsSync(path.resolve(DIR, ".git"))) {
        await $`cd ${DIR} && git clean -fd && git checkout . && git pull`;
    } else {
        await $`git clone https://github.com/JinDX/htmlspecs.com ${DIR} --depth=1`;
    }
}

async function replaceUrls() {
    const glob = new Glob(`${DIR}/**/*`);
    for await (const filepath of glob.scan(".")) {
        refactorFile(filepath, (text) =>
            text
                .replaceAll("https://htmlspecs.com/", "https://html.yieldray.fun/")
                .replaceAll("https://ecma262.com/", "https://ecma262.yieldray.fun/")
        );
    }
}

async function xmit() {
    await $`cd ${DIR} && git rm -f README.md  || true`;

    await Bun.write(
        path.resolve(DIR, "xmit.toml"),
        `\
404 = "404.html"

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
    await $`cd ${DIR} && xmit html.yieldray.fun`;
}
