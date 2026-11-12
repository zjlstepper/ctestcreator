# TOEFL C-test creator

Create original TOEFL-style Complete the Words passages and generate a standalone interactive HTML practice page. The skill defines the authoring and review process. The renderers take a finished bracketed passage as input.

## Install the skill

Download or clone this repository and place its contents in your agent’s skills directory under `toefl-ctest`. Keep `SKILL.md`, `scripts/`, and `assets/` together. Ask the agent to use `toefl-ctest` and specify a topic and difficulty.

## Render a passage

Save the paragraph as UTF-8 text with exactly ten missing suffixes in square brackets, as in `ecol[ogy]`. See [SKILL.md](SKILL.md) for the passage structure and gap rules.

From the repository root, run either command with an available runtime:

```sh
node scripts/render_ctest.js passage.txt practice.html
python3 scripts/render_ctest.py passage.txt practice.html
```

On Windows, use `py -3` or an installed Python 3 executable in place of `python3`. Both renderers use only built-in libraries. You can also open [assets/generate.html](assets/generate.html) locally and select the passage, `assets/practice.html`, and `assets/avatar.png`.

## Practice

Open the generated `practice.html` in your browser. It runs offline with its avatar embedded. The gray fields keep one underline per missing letter and spread the letters and underlines slightly while typing. Complete suffixes join the passage text in the same font and size. **Submit** shows the score and answer review, and **Try Again** resets the exercise.
