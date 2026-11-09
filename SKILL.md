---
name: toefl-ctest
description: Write an original TOEFL-style Complete the Words passage on a user-selected topic and difficulty. Generate the bracketed C-test and a matching standalone interactive HTML practice page.
---

# TOEFL C-test

Act as an English proficiency item writer. Create one original academic Complete the Words passage per request by default. Use the requested topic and difficulty. If the topic is missing, ask for it. If difficulty is missing, use intermediate. Vary difficulty through the vocabulary and syntax of the passage while keeping the answer to every gap unambiguous.

## Author the passage

1. Write one coherent, self-contained paragraph of 75–85 words before inserting gaps. Use accurate, accessible academic English and a clear topic sentence. Favor sentences with ordinary terminal punctuation. Avoid abbreviations with internal periods, decimal notation, and quoted sentence endings so the renderer can verify sentence boundaries.
2. Leave the first sentence and at least two complete closing sentences intact. Choose the first or second word of sentence two as the initial target. After each gap, leave the next word intact and target the following word. Apply this rhythm across sentence boundaries within the gapped portion.
3. At each target, skip any ineligible word and move forward one word at a time to the next eligible word. Resume the every-second-word rhythm from the word actually gapped. Exclude a word already gapped (case-insensitive), a proper noun, jargon, any word with a plausible competing spelling, and any prefix with more than one natural completion in context. Rewrite the draft if this process cannot yield ten gaps with a sensible mix of content and function words.
4. Gap only the final letters of the word. Hide exactly the last two letters of three- and four-letter words, such as `t[he]` and `ra[in]`. For words with five or more letters, hide at least the last three letters, such as `ecol[ogy]` or `develop[ment]`. For eligible two-letter words, hide the last letter, as in `i[n]`. Leave a visible prefix that gives a useful clue in context. Count letters only, and keep punctuation outside the brackets.

## Review and deliver

- Reconstruct the complete passage. Check word count, factual accuracy, grammar, ten unique gapped words, suffix lengths, intact opening and closing sentences, and the skip-and-resume rhythm. For each gap, try competing words, inflections and regional spellings against the visible letters, missing-letter count and full context. Rewrite or skip any gap with a credible alternative. The renderer verifies structure, while this editorial review establishes answer uniqueness.
- Save the passage as UTF-8 plain text with the ten bracketed suffixes. The text file contains only the paragraph. Use the same file to generate the HTML. Run the command from the skill directory, or use absolute paths.

```sh
python scripts/render_ctest.py path/to/passage.txt path/to/practice.html
```

- Open or inspect the HTML and confirm it presents the same passage with ten empty inline inputs and that Submit checks the expected suffixes. Deliver links to both files. If showing the passage inline as well, reproduce just the paragraph with square brackets for the missing letters.
- The supplied template follows the TOEFL platform's standalone Reading C-test view. It includes the teal banner, question-range strip, hideable elapsed timer, centered passage, length-matched blanks and focus advancement. Submit scores locally and reveals answers in review. The file opens offline and needs no login, remote assets, or platform registration. Use it for newly generated passages.
