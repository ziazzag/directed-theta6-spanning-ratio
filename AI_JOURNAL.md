# AI journal

Zachary Iazzag · INFO-F420 Computational Geometry (ULB) · solo project

Topic: *The Spanning Ratio of the Directed Θ6-Graph Is 5* (Bose, De Carufel, Stuart, Hill, SoCG 2026; full version arXiv:2603.09048).

This journal follows the course requirements: tools and models, significant prompts and answers, how I used, checked, corrected or rejected the results and my own decisions and contributions.

## 1. Tools and access limits

- **Claude** (Anthropic) for the technical part: understanding the paper, the code, the checks. For the website I used **Claude Code** (Opus 5.5) in the VS Code extension. It could read and write the files of my project folder, run Node.js (tests, experiments) and open the page in Chrome to check the layout.
- **Perplexity** for the documentation: searching related articles and summarising them, I personally think it outperforms Claude for this kind of task.
- **How I worked:** in iterations, on 4 different days for the preliminary version and 5 different days for the final version. In between I reviewed and corrected the site on my own, without AI (section 2). A session usually went like this: I described one change, looked at the result in the browser and then kept it, corrected it or asked for something else.
- **Topic choice:** I used Perplexity to get a list of candidate articles. The choice was mine (section 2).
- **Python + scipy**, only for an independent cross-check of the linear programs (`experiments/lp_crosscheck.py`).
- **Video:** made in my own motion-design setup: Claude Code with HyperFrames and ffmpeg for the animation and the rendering, ElevenLabs for the AI voice-over.

**Access limits**

- Some sites refuse automated access (DBLP, Springer pages, the CCCG 2024 proceedings). The references concerned were checked another way: DOI records, OpenAlex, HAL, the CCCG proceedings pages, the bibliography of the main paper.
- My subscription has usage limits and I reached them often. This is why the work was split into many shorter sessions over several days, with my own work in between.

## 2. My decisions and contributions

- **Choice of the topic.** I first asked Perplexity to propose many candidate articles. Some of them were already taken by other students. Among the rest I took my time to compare them and chose the one I liked most: an interesting result that I understood and that I could see how to illustrate well.
- **Understanding first.** Before any practical work, I read the paper on my own and asked the assistant each time something was not clear technically. I also looked for videos on the topic (YouTube) because I understand things better visually. My first goal was to understand everything before starting the practical part.
- **Plan.** With the assistant I discussed what to put on the website (which proofs, which texts) to keep the important parts and stay clear and understandable. I made a to-do list of everything I planned for the project and wrote the proposal (24 October). It fixes the plan that the final page follows: an explorer with exact spanning ratio and animated greedy routing, an example where greedy routing spirals, the 5 − ε and 4 − ε constructions with a slider on δ, a game and a random search, figures for the main steps of the upper bound (hexagonal distances, the empty region R, the lemma on edges crossing R, the two competing paths), one linear program reproduced in the page and numerical tests written **before** the visual parts.
- **Building, in iterations.** From then on I built the website with the assistant. It wrote the code. We worked in many iterations to refine the site, the figures, the interactions and the content. I always looked at how the code was organised. I also spent one session (before final version) with the assistant reorganising the code and removing useless files so the project stays clean.
- **Without AI.** Between the iterations I worked on my own: I reread the whole site, rephrased the texts so that everything is understandable, removed inconsistencies and useless information and validated what had been done (making sure I understand everything written). At each rereading I also checked that my sources say what I say about them.
- **Quality requirements I set for the whole project:** content that I can understand and explain at the oral; nothing invented, every claim, number and reference checked against the paper or another source; a natural writing style.
- **Preliminary version (11 November).**
  - Only the webpage is shared with the other students, not the code or this journal.
  - Design choices: sober fonts that are not the usual defaults, numbered section titles, clearer presentation of the known bounds (2, 4 to 7, 5).
  - I asked for a careful audit of the bibliography (origin of each reference, existence, usefulness, authors and dates).
  - I checked whether the page was not too hard for me to understand and explain. Then I asked for readability changes: an introduction with a road-network analogy, the hexagon notation of the paper for the two norms, a plain-language sentence before each step of the proof.
  - I questioned the usefulness of the "checks" section and kept it because it shows how the code is validated.
  - Published on GitHub Pages and posted on the forum.
- **Final version (until 25 November).** Same way of working: iterations with the assistant, then independent review.
  - Worked locally first, published only at the end. For the final version the code and this journal are public too, as the course asks for a public repository with all the code.
  - I went through the page with the assistant to look for missing content: points that could be explained more precisely or illustrated better. This led to two additions planned in my proposal: the slider on δ for the 4 − ε example and the figure of the two candidate paths. The assistant first said the figure was out of scope (too long, hard to verify); I questioned this and it was then done in a few minutes.
  - I asked for a complete re-audit: every reference (authors, dates, volumes, pages), every number on the page, coherence with the course requirements and whether everything stays explainable for me.
  - I asked for more of the proof to be explained on the page: why the region R is empty, the derivation of inequality (2) and where each family of inequalities of the linear programs comes from.
  - I decided not to cover Sections 5.1–5.3 of the paper (cases where the assumptions fail, third path), as already planned in my proposal.
  - I decided to keep only the references directly about Θ-graphs (11 instead of 23) so I can explain each of them. The wider context (Delaunay triangulations, other tight results) is only summarised with a pointer to the introduction of the paper.
- **Video.** A 1 min 34 explainer in 2D motion design with an AI voice-over, at the top of the page. It covers the spanning ratio, the Θ6-graph, why the directed case is harder, how a ratio of 5 can happen and why it is never worse. I made it in my own setup from the script and my site (prompt 12).
- **Checks against the paper.** With the assistant I went through the PDF wherever the code and the paper did not agree at first: (1) the exact hypotheses of Lemmas 3 and 9 (pp. 8 and 15), which the first tests had read wrongly; (2) inequalities (6) and (7), printed with ≤ but coming from a strict assumption, which changes the result of the linear programs (8 instead of 16 infeasible cases); (3) the bound 5 − 72δ of Lemma 1, compared with the measured ratio (about 5 − 18δ, so the constant of the paper is not tight).
- **Writing of the report.** The texts were written during the iterations with the assistant; I reread and rephrased them during my independent review (above).

## 3. How I used the assistant

- **Code:** following my plan, the assistant wrote the code: the Θ6 library, the interactive figures, the linear programming solver and the test suite. I reviewed each version in the browser, looked at how the code was organised and asked for changes (missing items of my proposal, readability, layout, a cleaner file structure).
- **Explanations:** each time something in the paper was not clear to me, I asked for an explanation (in French). I also asked for two documents in French. The first starts from the basic definitions and follows the page section by section, with self-test questions. The second is a guide for the oral: what to say for each section and the questions the teacher may ask. They helped me see how the proof fits together, and I use them to rehearse.
- **Literature:** I went through the reference list of the paper myself: I looked at what each cited paper is about and kept the ones I need for the parts my page explains. Then I asked Claude to summarise the ones I kept. For papers that are not in the reference list of the paper I used Perplexity (prompt 3). Claude Code also looked for papers citing the main article and looked up the metadata of the references (DOI records). Each time I was about to use a source, I double-checked it myself (authors, date, content). In the end I kept 11 references: the two versions of the paper, eight papers from its reference list and one paper found with Perplexity.
- **Texts:** see "Writing of the report" in section 2.

## 4. Significant prompts (written in French, summarised here)

| Objective · date | What I asked | Answer and how I used it |
| --- | --- | --- |
| 1. Topic choice · 23/10 (Perplexity) | A research task: find candidate articles for my project that fit the course requirements [recent research article in discrete and computational geometry, published in a computational geometry venue (SoCG, EuroCG, CCCG, JCDCG, JoCG, DCG, CGTA, IJCGA), provably correct algorithms with a formal analysis]. Give me only interesting candidates that fit these conditions. | A list of candidate articles that fit the conditions. I looked at each paper, read them roughly and chose the one I found the most interesting. |
| 2. Understanding the paper · 23/10 (Claude) | Once the paper was chosen and after reading it myself: a complete summary of the whole paper. Then questions on the parts where I was stuck, mainly the 5 − ε construction. | A summary of the whole paper. I compared it with my own reading to check that I had not missed anything, and the answers to my questions helped me with the parts I had not understood alone. |
| 3. Literature · 24/10 (Perplexity) | I already had the reference list of my paper. Find other articles related to it: serious, fitting the conditions of the project and relevant to what I want to explain. | Candidate articles with a short summary of each. The one I kept is Bonichon, Gavoille, Hanusse and Ilcinkas (2010): the undirected Θ6-graph is the union of two TD-Delaunay graphs, which explains its ratio 2. All my other references come from the reference list of the paper. |
| 4. Plan of the website · 24/10 (Claude) | From my proposal and the course rules, help me decide what to put on the website (which proofs, which texts, which figures) to keep the important parts and stay clear. | A plan of the page: definition, interactive lab, the 5 − ε and 4 − ε constructions, a game, a map of the upper-bound proof with figures, numerical tests. I turned it into my to-do list. |
| 5. Building the website · 29/10 | An interactive website that follows my proposal. Not overloaded with useless information: understanding comes first, before quantity. | A first version with the interactive parts of my proposal. Then I asked for many changes over the next sessions, for example: a cleaner design (dark background, few colours, a more modern font, a clearer layout where the reader gets lost less); less information in section 1, the introduction, which was too heavy and would lose the reader instead of interesting them; better interactive parts, which were not intuitive, had too few options and were not clear visually. |
| 6. Readability · 03/11 (Claude) | Some parts are too hard to understand: make them simpler without removing content, in particular the introduction (use a road network analogy), the two hexagonal norms and the steps of the upper-bound proof. | Road-network analogy, the hexagon notation of the paper for the two norms and a plain-language sentence before each step of the proof. I reread the page to check that I could explain each part. |
| 7. Checking the bibliography · 05/11 (Perplexity) | I already checked my references by hand. I want a double check with any tool that can verify references automatically (authors, title, venue, year, DOI). | It checked each reference against online sources and gave me a corrected list: several entries corrected and several references removed. I compared this list with mine before changing anything. |
| 8. Planning the final version · 13/11 (Claude) | A complete status of where I was compared with my plan. Questions on the parts of the paper I had not fully understood (almost every lemma, for example Lemma 3, the empty region of Lemma 4 and Lemma 9). Then continue the work on what was not done yet, in the same way as for the preliminary version. | A status of each item of my plan (done or not) and an explanation of each lemma I asked about, which I compared with the PDF. The work then went on in iterations, as for the preliminary version. |
| 9. Missing content · 19/11 (Claude) | Check whether I missed anything important in the content, compared with my proposal, and what could be explained more precisely. | Two items of my proposal were missing: the slider on δ for the 4 − ε example and the figure of the two candidate paths. The assistant first said the figure was out of scope; I questioned this and both were added. I checked that they follow my proposal. |
| 10. Verification against the paper · 24/11 (Claude) | Check that every claim on the page is supported by the paper: every number, every reference and its metadata. | A list of corrections (section 5): the exact hypotheses of Lemmas 3 and 9, inequalities (6) and (7) that must be strict, several sentences made more precise. I reread each corrected sentence against the PDF. |
| 11. Selecting the references · 25/11 (Claude) | 23 references seems a lot for my project: which ones does my page really use, and which ones are the least relevant to my work? | A proposal to keep the 11 references that the page uses directly and to summarise the wider context in one sentence with a pointer to the introduction of the paper. I checked it against my page and kept these 11. |
| 12. Explainer video · 25/11 (Claude Code, HyperFrames, ffmpeg, ElevenLabs) | With my motion-design setup ready: a script for a short educational video (1 to 2 minutes) from my page, then the video itself in 2D motion design with an AI voice-over. | A 6-scene script of about 1 min 30, then the video (1 min 34) built in my setup from the script and my site. |
| 13. Cleaning the project · 25/11 (Claude) | Reorganise the whole folder, refactor the code and remove every useless file, so that the project is clean for the submission. | The project is now split into clear folders: site/ with everything that goes into the zip (page, code, tests, experiments, video, README, this journal), pages/ for the public copy, and separate folders for the course documents, the papers, the oral and the video script. An old copy of this journal was removed. The code had no unused function and no debug output left, so it was kept as it is instead of changing working code just before the submission. I checked that the tests still pass and that the zip contains exactly the site folder. |

## 5. How results were checked, corrected or rejected

**Checks**

- `node tests/run-tests.js`: both definitions of the edges give the same graph; undirected ratio ≤ 2 and directed ratio ≤ 5‖st‖ (Theorem 1) on 300–400 random sets; Lemmas 2, 3 and 9 on random configurations; the Lemma 1 construction for several δ; the 20 linear programs; the 5-point example; the spiral. A lighter version runs in the page (§6).
- Linear programs: same result as the paper (16 infeasible cases, the same 4 open cases), confirmed by a second solver (scipy) and an exact certificate (weights checked with fractions) for each infeasible case.
- References: every DOI checked on Crossref or DataCite (authors, title, venue, volume, pages, year); the arXiv version with the arXiv API; the abstract of Bonichon et al. on HAL; Ruppert and Seidel (no DOI) in the author index of the CCCG 1991 proceedings.

**Corrected**

- **Formula of the qⁱ (Lemma 1).** Built literally, the construction fails (the shortest path skips about half of the points, ratio 3.95 < 4). With ‖tqⁱ⁻¹‖ instead of ‖tqⁱ‖ it gives the path of the paper. I checked it myself in both versions of the paper: the same formula is on p. 5 of each. So it is probably a typo. The page says so and the tests compare both versions.
- **Lemmas 3 and 9.** The first tests read their hypotheses wrongly (one hypothesis missing, same norm on both sides) and reported violations. Corrected with the exact statements (pp. 8 and 15): 0 violations.
- **Random search.** The first version found "ratios" around 10⁴ with degenerate point sets (points on a cone boundary). Moves too close to a cone boundary or to another point are now rejected.
- **Linear programs.** The paper prints inequalities (6) and (7) with ≤. But they come from the strict assumption d(s,t) > 5‖st‖. With ≤ only 8 of the 20 systems are infeasible; with < we get the 16 of the paper. This is stated on the page.
- **Bibliography.** 11 November: wrong arXiv identifier (it pointed to another paper), wrong author order of the SoCG version, Chew's first name, 7 unused references removed. 25 November: Bonichon et al. 2010 added back after its abstract was checked (HAL); list reduced from 23 to 11.
- **Wording.** Several sentences were made more precise during the final audit: r only *tends* to (½, √3/2); "introduced by" instead of "introduced independently by"; "shortest path" instead of "only path"; a wrong "because" in the spiral paragraph replaced by a check with Dijkstra, now also in the tests.

**Rejected or limited**

- No copy of the figures of the paper (course rules). The two candidate paths are drawn on a real point set computed by the code, and the page says it is not the situation of the proof.
- The preliminary page said "I still need to confirm this with the teacher" about the typo of p. 5. I had it removed: nothing had to be confirmed with the teacher.
- The first fonts were the usual defaults of AI-generated pages. I asked for different ones.
- The first bibliography had 23 entries. After going through each of them, summarising them with the assistant and checking them, I removed 12 and kept the 11 essential ones: those directly about the topic and that I can explain.
- When I reread section 5 it was too dense and hard to follow. The details (why R is empty, the derivation of (2), the variables of the linear programs) went into collapsible blocks. Vague pointers like "see below" or "figure below" were replaced by links to four numbered blocks (5.1 to 5.4), each with its own figure.
- The random search is presented only as an exploration, not as evidence about the worst case: it never reaches the 3.989 of the hand-made 5-point set.
- I chose not to re-derive Lemma 3, inequalities (10)–(19) and Sections 5.1–5.3 of the paper. The page says clearly that they come from the paper.
