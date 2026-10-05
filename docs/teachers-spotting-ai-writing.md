# Can teachers spot AI-written student work? A research briefing

*Compiled 2026-10-05. Fleckenstein et al. (2024) was read in full; every other study below is
summarised from its abstract, a publisher/university page, or secondary coverage (marked
†), because several publisher sites blocked direct access. Check numbers against the
originals before quoting them.*

## 1. The anchor paper: Fleckenstein et al. (2024)

[Do teachers spot AI? Evaluating the detectability of AI-generated texts among student
essays](https://doi.org/10.1016/j.caeai.2024.100209) — *Computers and Education: Artificial
Intelligence* 6, 100209 (Fleckenstein, Meyer, Jansen, Keller, Köller & Möller).

**Design (two experiments, same logic)**
- Task: short argumentative English-as-a-foreign-language essays (a TOEFL iBT prompt, 30
  minutes, no resources) from 11th-grade students in Germany/Switzerland, pre-scored on the
  official 0–5 TOEFL rubric.
- Each participant read **4 texts**: two student essays (one scoring 2, one scoring 4) and
  two ChatGPT essays *prompted with the rubric's level-2 and level-4 descriptors*. So the AI
  texts were deliberately written to be weak/medium/strong, not left at ChatGPT's default.
- For each text: "Was this written by an AI?" (yes/no), a 50–100% confidence rating, then
  1–7 quality ratings (language, structure, content, overall).
- **Study 1:** 89 pre-service teachers (Master of Education, German university, EFL
  readers), told half the texts were AI.
- **Study 2:** 200 teachers recruited on Prolific (English native speakers, mostly UK/North
  America, 93% currently teaching, 61.5% teaching English), told only that *some* texts were
  AI. Student essays were randomly drawn from the corpus rather than hand-picked.

**Results**
| | Pre-service (S1) | Experienced (S2) |
|---|---|---|
| AI texts correctly called AI | 45.1% | 37.8% |
| Student texts correctly called student | 53.7% | 73.0% |
| Mean confidence | ~77% | ~80% |

- S1: stated source and real source were statistically independent (φ = −0.01) — i.e.
  chance-level guessing.
- S2: still independent for **low-quality** texts; for **high-quality** texts experienced
  teachers did better (φ = .275). The authors' reading: experienced teachers hold a
  stereotype of "AI = polished", so they call good texts AI and weak texts student — and
  were unaware ChatGPT can be prompted to write weakly (86% of weak texts judged "student",
  whatever their source).
- Confidence tracked *what teachers assumed* (less confident when they thought "AI"), not
  whether they were right. Both groups were overconfident.
- AI texts were rated at least as well as student texts; experienced teachers gave
  high-quality AI essays *higher* scores than equivalent student essays.
- Authors' own limitations: (a) pre-service sample may lack skill; (b) S1 told them half
  were AI — unrealistic; (c) only two student texts in S1; (d) S1 and S2 differ in several
  ways at once, so the cause of the different results is unclear. They also note that
  teachers know nothing about the student or context in this design.

## 2. Other studies on humans spotting AI text

| Study | Who judged | Material | Main result |
|---|---|---|---|
| [Waltzer et al. 2023](https://doi.org/10.1155/2023/1923981), *Human Behavior and Emerging Technologies* | 69 HS teachers, 140 HS students | **Pairs** (one student, one ChatGPT) | Teachers 70%, students 62%. Confidence, ChatGPT experience and subject expertise did *not* predict accuracy; well-written student essays were hardest. |
| [Waltzer et al. 2024](https://doi.org/10.1007/s40979-024-00158-3) ("Can you spot the bot?", *Int. J. Educational Integrity*) † | 140 college instructors, 145 students | Pairs; student essays written in-class | Instructors 70%, students 60%, ChatGPT itself 63%. Experience didn't predict accuracy; confidence was low. |
| [Scarfe et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11206930), *PLOS ONE* † | Real markers, real exams | 100% AI answers injected into 5 undergraduate psychology modules | **94% undetected**; AI averaged about half a grade boundary above real students. |
| [Perkins et al. 2024](https://arxiv.org/abs/2305.18081), *J. Academic Ethics* † | 15 faculty + Turnitin AI score | 22 GPT-4 submissions, some prompted to evade detectors | Turnitin flagged 91% as containing AI but only 54.8% of the text; faculty reported 54.5% of the AI submissions; AI averaged 52.3 vs 54.4 for genuine work. |
| [Casal & Kessler 2023](https://digitalcommons.memphis.edu/facpub2/10) † | 72 reviewers from top linguistics journals | Research abstracts | 38.9% correct overall; nobody got all four right; reasons given were sensible but inconsistent. |
| [Jakesch, Hancock & Naaman 2023](https://doi.org/10.1073/pnas.2208839120), *PNAS* † | ~4,600 lay participants | Self-descriptions (profiles) | Judgements rely on flawed heuristics (first-person pronouns, contractions, family topics → "human"), which makes them predictable and exploitable: text can be "more human than human". |
| [Clark et al. 2021](https://aclanthology.org/2021.acl-long.565) † | Untrained crowd workers | GPT-3 stories/news/recipes | Chance-level; brief training lifted accuracy only to ~55%. |
| [Dugan et al. 2023 (RoFT)](https://arxiv.org/abs/2212.12672) † | Many annotators | Text that switches from human to machine | Often poor, but large variance between people, and people improved with incentives and practice. |
| [Hassoulas et al., as quoted in a 2025 Frontiers review](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1711718/full) † | Evaluators of coursework | Undergraduate/graduate coursework | Only 23% / 19% correctly identified ChatGPT texts, though evaluators were often *suspicious* of content and references. |
| [JALT study of 20 writing instructors](https://jalt.journals.publicknowledgeproject.org/index.php/jalt/article/view/1895) † | 20 experienced postsecondary writing instructors | 4 essays each | Moderate confidence, low accuracy: only 35% got all four right. AI essays scored higher on spelling, grammar and organisation, *lower* on argumentation and evidence. |
| Second-language-writing teachers study (*J. Second Language Writing*, S1075293524000928) † | ESL writing teachers | Essays | ~61% accuracy, rising to ~67% with brief exposure/self-training. |

## 3. The newer finding that cuts the other way

[Russell, Karpinska & Iyyer (ACL 2025)](https://aclanthology.org/2025.acl-long.267),
"People who frequently use ChatGPT for writing tasks are accurate and robust detectors of
AI-generated text":
- 300 English non-fiction articles (human vs. GPT-4o / Claude / o1), labelled with
  paragraph-length justifications by annotators hired on Upwork.
- **Non-experts** (little LLM use): ~56.7% accuracy, high confidence.
- **Experts** (frequent LLM users for writing/editing work; described in coverage as
  including teachers, writers and editors †): the *majority vote of five* misclassified
  **1 of 300** — matching the best commercial detector (Pangram) and beating most others,
  even after paraphrasing and "humanizer" evasion.
- What experts used: AI vocabulary (~53% of explanations — "vibrant", "crucial"), formulaic
  sentence structure and listing (~36%), blandness/lack of originality (~24%), stilted
  quotation style (~22%). Different experts used different cues, which is why the ensemble
  was so strong. Individuals were much weaker than the group, and confidence dropped
  against o1-Pro.
- Limits: American-English non-fiction under 1,000 words; a pooled five-person vote is not
  how a single teacher marks.

## 4. Why the literature may not match what you see in your own marking

These are my interpretations from the evidence above, not established findings.

1. **The research mostly measures a different, harder task.** Cold, single-text
   classification of short timed essays, with no knowledge of the writer, no assignment
   context, no baseline of that student's earlier work, and no ability to ask a follow-up
   question. Marking your own students is a different job. I did not find a study that
   tests teachers judging *their own students'* work against known prior samples; that
   looks like the main gap.
2. **The AI texts in the key study weren't "ChatGPT's default voice."** Fleckenstein
   prompted with rubric descriptors, including a deliberately weak level. What you find
   "obvious" is plausibly the *default or lightly prompted* register: tidy intros and
   conclusions, three-item lists, generic vocabulary, no concrete specifics, claims without
   evidence (the JALT study found AI weaker on argument and evidence), invented or odd
   references. A student who asks for "a mediocre B-level essay with a couple of
   errors" removes much of that, and the studies suggest teachers don't expect that to be
   possible.
3. **Survivorship bias with no feedback loop.** You see the cases you catch; you never
   learn about the ones you miss, because there is no ground truth. Scarfe's 94% shows
   what undetected submissions look like from the marker's side: just ordinary marking.
   Subjective certainty ("it's usually obvious") can therefore stay high while recall is
   low — the same pattern as the overconfidence Fleckenstein and Waltzer report.
4. **Recall and precision are different questions.** Fleckenstein's teachers were decent
   at saying "student" for student texts (73%) and poor at catching AI (38%). "Usually
   obvious" can be true of the AI you catch while still being compatible with a lot missed.
5. **The headline "teachers can't tell" is flatter than the data.** Results run from
   chance (Fleckenstein, ~38–45% on AI texts) to ~70% in paired-choice designs (50% is
   chance there, so 70% is meaningfully above chance but still wrong 3 times in 10) to
   near-perfect for pooled expert readers. Task format, text length, how the AI text was
   made, and who is judging all move the number.
6. **"It used to be more obvious" has support, with caveats.** Early default output had
   strong tells, and population-level word-frequency work (e.g.
   [Kobak et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12219543), *Science
   Advances*, ≥13.5% of 2024 PubMed abstracts show LLM style-word excess) shows the
   "delve" effect is real. But as users learn to prompt for voice, imitate samples, or run
   humanizers, the tells weaken: Epoch AI's 2026 test
   [found detectors miss ~13% of style-imitated passages](https://epoch.ai/data-insights/ai-text-detection-challenges)
   † (vs ≈0% for plain prompts), and Russell et al. saw expert confidence fall on o1-Pro.
   So both are plausibly true: default text is easier to spot than ever *to a practised
   reader*, and prompted text is getting harder.
7. **Expertise might be *LLM familiarity*, not teaching experience.** Russell et al.'s edge
   comes from frequent LLM use; Waltzer found self-reported ChatGPT experience didn't help.
   These aren't contradictory if "experience" there was thin or self-rated, but it is
   unresolved. Fleckenstein's experienced teachers did better on polished texts only.
8. **Human cue-use is partly wrong.** Jakesch et al. show that common heuristics are
   unreliable and manipulable, and Casal & Kessler's reviewers gave sensible-sounding but
   inconsistent reasons. A gut sense of "obvious" can be a correct pattern *or* a
   stereotype; from the inside they feel the same.

## 5. Detection software isn't the way out

- [Weber-Wulff et al. 2023](https://arxiv.org/abs/2306.15666): 14 tools (incl. Turnitin) were
  neither accurate nor reliable, skewed toward "human", and degraded by obfuscation.
- [Liang et al. 2023, *Patterns*](https://arxiv.org/abs/2304.02819): seven detectors
  flagged on average 61.3% of TOEFL essays by non-native writers as AI, while classifying
  US eighth-grade native-speaker essays accurately. False accusations fall unevenly.
- 2025–26 preprints continue to report weakness on mixed-authorship text and near-total
  evasion after humanizing ([2508.08096](https://arxiv.org/abs/2508.08096);
  [2608.11256](https://arxiv.org/html/2608.11256v2) †).

## 6. What a study matching your experience would look like

Real course with known ground truth (students' own disclosure or controlled in-class vs
take-home conditions); teachers who know their students and have baseline writing; AI
texts produced both ways (default and student-realistic prompting); report recall *and*
false-accusation rate, with calibrated confidence; and compare single teachers to
pooled judgements. Until that exists, "I can usually tell" is neither confirmed nor
refuted for the setting you care about.

## 7. Implications that follow from the evidence

- Treat a teacher's suspicion as a prompt to *check* (conversation, drafts, oral
  explanation), not as evidence. False positives against non-native writers are a documented
  harm.
- Training works a little (ESL study, Clark) and exposure to LLM-written text helps;
  teaching staff what weak-but-AI text looks like addresses Fleckenstein's blind spot.
- Process-based and in-person assessment sidesteps the detection problem, which is what
  Fleckenstein's authors recommend.

## Sources not opened
Springer, ScienceDirect (except via a PDF mirror for Fleckenstein), and the JALT site
could not be fetched directly; †-marked items rely on search summaries.
