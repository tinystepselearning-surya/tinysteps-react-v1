import "./week1.react.css";
import { useCallback, useState } from "react";

function CopyButton({ targetId }: { targetId: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const text = el.textContent?.trim() ?? "";
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [targetId]);

  return (
    <button
      type="button"
      onClick={onCopy}
      data-state={copied ? "copied" : undefined}
      aria-live="polite"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function Week1Native() {
  return (
    <div className="week1-page">
      {/* Floating aurora gradient background */}
      <div className="aurora" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      {/* Main content */}
      <main className="page-content" id="top">
        <section className="hero wrap reveal" aria-labelledby="week1-title">
          <p className="eyebrow">Week 1 Learning Spotlight</p>
          <h1 id="week1-title">SATPIN Starters &amp; Brave First Introductions</h1>
          <p className="lead">
            Tiny Steps learners launch their journey with foundational sounds, joyful noun hunts, and brave
            self-introductions. Use these highlights to keep curiosity alive at home.
          </p>

          <div className="hero-highlights">
            <div className="hero-card">
              <span className="label">Phonics Focus</span>
              <p>SATPIN letter-sound launch with blending practice</p>
            </div>
            <div className="hero-card">
              <span className="label">Grammar Skill</span>
              <p>Nouns that name people, places, animals, and things</p>
            </div>
            <div className="hero-card">
              <span className="label">Speaking Goal</span>
              <p>Confident introductions with name, age, and a fun fact</p>
            </div>
          </div>
        </section>

        <section className="wrap learning-grid reveal" aria-label="Classroom recaps and captions">
          <article className="learning-card">
            <span className="badge phonics">Phonics</span>
            <h2>Discover SATPIN Sounds</h2>
            <p className="summary">
              We explored the first six powerhouse sounds — S, A, T, P, I, N. Learners traced, tapped, and built
              short words like <em>sat</em>, <em>pin</em>, and <em>nap</em> to feel how sounds blend.
            </p>
            <ul className="tips">
              <li>Say each sound separately, then blend slowly: /s/ /a/ /t/ → sat.</li>
              <li>Hide letter cards around the room and have your child hunt and read the word they build.</li>
              <li>Spot SATPIN letters in books, cereal boxes, or street signs and cheer each find.</li>
            </ul>
            <div className="social-pack">
              <p id="w1p" className="caption">
                We kicked off with SATPIN! Ask your reader to blend today’s word list: sat, pin, tap, nap, sit.
                Celebrate every confident sound.
              </p>
              <p id="w1pTags" className="hashtags">
                #TinyStepsLearning #PhonicsForKids #SATPIN #EarlyReaders
              </p>
              <div className="btns">
                <CopyButton targetId="w1p" />
                <CopyButton targetId="w1pTags" />
              </div>
            </div>
          </article>

          <article className="learning-card">
            <span className="badge grammar">Grammar</span>
            <h2>Name the People, Places &amp; Things</h2>
            <p className="summary">
              Nouns were everywhere this week! Learners sorted pictures into people, places, animals, and things,
              then built short sentences to show their understanding.
            </p>
            <ul className="tips">
              <li>Play a “noun detective” game — call out a category and have your child point to a matching noun nearby.</li>
              <li>Make a mini book with four pages labelled Person, Place, Animal, Thing and draw an example for each.</li>
              <li>Encourage full sentences: “The <strong>teacher</strong> is in the <strong>school</strong>.”</li>
            </ul>
            <div className="social-pack">
              <p id="w1g" className="caption">
                Noun hunters unite! We found people, places, animals, and things everywhere we looked. Try a quick noun
                treasure hunt at home.
              </p>
              <p id="w1gTags" className="hashtags">#TinyStepsLearning #GrammarFun #Nouns #NamingWords</p>
              <div className="btns">
                <CopyButton targetId="w1g" />
                <CopyButton targetId="w1gTags" />
              </div>
            </div>
          </article>

          <article className="learning-card">
            <span className="badge speaking">Public Speaking</span>
            <h2>Introduce Yourself with Confidence</h2>
            <p className="summary">
              Learners practised greeting the group with a smile, sharing their name and age, and adding one fun fact.
              We celebrated brave voices and friendly eye contact.
            </p>
            <ul className="tips">
              <li>Model a warm introduction, then invite your child to take the spotlight.</li>
              <li>Record a short video so they can hear their confident voice.</li>
              <li>Switch roles and let your child interview you with “What’s your favourite…?” questions.</li>
            </ul>
            <div className="social-pack">
              <p id="w1s" className="caption">
                Hello, I am ready to shine! Practise name, age, and one fun fact together tonight to keep introductions
                smooth and smiling.
              </p>
              <p id="w1sTags" className="hashtags">
                #TinyStepsLearning #TinySpeakers #ConfidenceBuilding #KidsSpeech
              </p>
              <div className="btns">
                <CopyButton targetId="w1s" />
                <CopyButton targetId="w1sTags" />
              </div>
            </div>
          </article>
        </section>

        <section className="wrap parent-support reveal" aria-labelledby="parent-support-title">
          <div className="support-intro">
            <h2 id="parent-support-title">Support at Home in 15 Joyful Minutes</h2>
            <p>
              Choose one playful idea each day to reinforce Week 1 learning. Short, consistent bursts of practice build
              confident, curious communicators.
            </p>
          </div>
          <div className="support-grid">
            <article className="support-card">
              <h3>Sound &amp; Blend Routine</h3>
              <p>Spread the SATPIN letters on the table. Pick three, say each sound, and slide them together to make a word.</p>
              <ul>
                <li>Use magnetic letters or sticky notes for hands-on fun.</li>
                <li>Swap the first letter to make new words: sat → pat → nat.</li>
                <li>End with a silly sentence using the day’s favourite word.</li>
              </ul>
            </article>
            <article className="support-card">
              <h3>Noun Sorting Sprint</h3>
              <p>Collect toys or household objects. Race to place them under the correct labels: person, place, animal, thing.</p>
              <ul>
                <li>Ask “Why did you choose that category?” to stretch vocabulary.</li>
                <li>Snap a photo of each group and label it together.</li>
                <li>Repeat with pictures from magazines or family albums.</li>
              </ul>
            </article>
            <article className="support-card">
              <h3>Family Intro Circle</h3>
              <p>Take turns introducing yourselves with name, age (or role), and one fun fact. Clap after each speaker to celebrate brave voices.</p>
              <ul>
                <li>Suggest sentence starters if your child needs a prompt.</li>
                <li>Practise eye contact by looking at the listener while speaking.</li>
                <li>End with a group cheer: “We are confident speakers!”</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="wrap progress-banner reveal" aria-labelledby="progress-title">
          <div>
            <h2 id="progress-title">Progress You Can Celebrate</h2>
            <p>
              Notice your child spotting SATPIN letters around the house, naming nouns in full sentences, and greeting
              others with a smile. Share these wins with your Relationship Manager so we can plan the next stretch goals
              together.
            </p>
          </div>
          <a className="cta" href="/main/book-demo/">
            Chat with us about your child&rsquo;s journey
          </a>
        </section>
      </main>
    </div>
  );
}
