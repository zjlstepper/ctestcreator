/* Validate and render a bracketed C-test in Node.js or a local browser. */
(function () {
    "use strict";

    const part = "\\p{L}+(?:\\[[A-Za-z]+\\])?";
    const wordPattern = new RegExp(part + "(?:[-'’]" + part + ")*", "gu");
    const gapPattern = /\[([A-Za-z]+)\]/g;
    const escapeHTML = value => value.replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;"
    })[char]);

    function render(source, template, avatarBase64) {
        if (/\n\s*\n/.test(source.trim())) throw new Error("Use one paragraph.");
        const passage = source.trim().replace(/\s+/g, " ");
        if (!/[.!?]$/.test(passage)) throw new Error("End the passage with terminal punctuation.");
        const sentences = passage.split(/(?<=[.!?])\s+/);
        if (sentences.length < 4 || [sentences[0], ...sentences.slice(-2)].some(text => /[\[\]]/.test(text))) {
            throw new Error("Keep the opening sentence and at least two closing sentences intact.");
        }
        const words = [...passage.matchAll(wordPattern)];
        if (words.length < 75 || words.length > 85) throw new Error("Expected 75–85 words, found " + words.length + ".");
        const gaps = [...passage.matchAll(gapPattern)];
        if (gaps.length !== 10 || /[\[\]]/.test(passage.replace(gapPattern, ""))) {
            throw new Error("Use exactly ten [letter] suffixes and no other brackets.");
        }
        if (!/\[[A-Za-z]+\]/.test(sentences[1])) throw new Error("Start gapping in the second sentence.");

        const fragments = [];
        const answers = [];
        const used = new Set();
        let cursor = 0;
        let previousPosition = -2;
        for (const [position, match] of words.entries()) {
            const token = match[0];
            const tokenGaps = [...token.matchAll(gapPattern)];
            if (tokenGaps.length === 0) continue;
            const start = match.index;
            const end = start + token.length;
            if (tokenGaps.length !== 1 || /[\p{L}\p{N}]$/u.test(passage.slice(0, start))) {
                throw new Error("Invalid gap inside " + token + ".");
            }
            const [gap] = tokenGaps;
            if (gap.index + gap[0].length !== token.length || /^[\p{L}\p{N}]/u.test(passage.slice(end))) {
                throw new Error("Bracketed letters must finish the whole word: " + token + ".");
            }
            if (position - previousPosition < 2) throw new Error("Leave at least one intact word after each gapped word.");
            previousPosition = position;
            const suffix = gap[1];
            const prefix = token.slice(0, gap.index);
            const word = prefix + suffix;
            const length = (word.match(/\p{L}/gu) || []).length;
            if (length >= 3 && length <= 4 && suffix.length !== 2) throw new Error("Gap exactly two final letters in " + word + ".");
            if (length > 4 && suffix.length < 3) throw new Error("Gap at least three final letters in " + word + ".");
            const key = word.toLowerCase();
            if (used.has(key)) throw new Error("Repeated gapped word: " + word + ".");
            used.add(key);
            answers.push({suffix, word});
            const label = escapeHTML("Blank " + answers.length + ". Missing letters after " + prefix);
            fragments.push(escapeHTML(passage.slice(cursor, start)));
            fragments.push('<span class="cloze-word">' + escapeHTML(prefix) +
                '<input aria-label="' + label + '" type="text" class="blank-input" style="--blank-length:' + suffix.length +
                '" maxlength="' + suffix.length + '" autocomplete="off" autocapitalize="none" spellcheck="false"></span>');
            cursor = end;
        }
        if (answers.length !== 10) throw new Error("Every gap needs a visible letter prefix in the same word.");
        fragments.push(escapeHTML(passage.slice(cursor)));
        const values = {
            PASSAGE: fragments.join(""),
            ANSWER_DATA: JSON.stringify(answers).replace(/</g, "\\u003c"),
            AVATAR: "data:image/png;base64," + avatarBase64
        };
        const markers = [...template.matchAll(/@@([A-Z_]+)@@/g)].map(match => match[1]).sort();
        if (markers.join(",") !== "ANSWER_DATA,AVATAR,PASSAGE") {
            throw new Error("Choose the skill's assets/practice.html template.");
        }
        return {html: template.replace(/@@([A-Z_]+)@@/g, (_, name) => values[name]), words: words.length};
    }

    if (typeof module === "object" && module.exports) {
        module.exports = {render};
        if (require.main === module) {
            try {
                const fs = require("fs");
                const path = require("path");
                const [passage, output, extra] = process.argv.slice(2);
                if (!passage || !output || extra) throw new Error("Usage: node render_ctest.js passage.txt practice.html");
                const destination = fs.existsSync(output) ? fs.realpathSync(output) : path.resolve(output);
                if (fs.realpathSync(passage) === destination) throw new Error("The input and output must be different files.");
                const assets = path.join(__dirname, "..", "assets");
                const result = render(fs.readFileSync(passage, "utf8"),
                    fs.readFileSync(path.join(assets, "practice.html"), "utf8"),
                    fs.readFileSync(path.join(assets, "avatar.png"), "base64"));
                fs.writeFileSync(output, result.html, "utf8");
                console.log("Rendered " + result.words + " words and 10 gaps to " + output);
            } catch (error) {
                console.error(error.message);
                process.exitCode = 1;
            }
        }
    } else {
        globalThis.renderCTest = render;
    }
})();
