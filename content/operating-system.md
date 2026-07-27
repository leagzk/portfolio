---
page: /operating-system
title: "Operating System - Léa Giezek"
description: "How my team ships: discovery as a gate, one source of truth, accessibility as the floor, ethics before AI - and distributed ownership holding all of it together."
indexable: false
---

<!-- Genere par `npm run content` depuis dist/. Ne pas editer a la main :
     la source de verite reste le .astro, ce fichier en est le reflet. -->

Designed to be handed over - seven principles, each with a practice behind it

# Operating System

**I didn't want a team that executes. I wanted a team of owners.** Recognized, accountable, proactive - experts with a name, a face, not just a pair of hands.

Everything below is how I built that, and it runs on one conviction: the technical system and the human system obey the same rule. Design tokens make products autonomous, distributed ownership makes people autonomous. **One variable in common: trust.**

## Nothing ships without discovery.

No component, no line of the roadmap ever shipped on a hunch. Every one started with the same work: what does the product ecosystem actually need, and what already exists that we can build on? **Need first, existing second, decision third.**

It's how we knew what to build versus what to buy - and it's the discipline I put in place after learning, the hard way, what it costs to build for the brand instead of the people who adopt it. **Discovery isn't a phase. It's the gate.** And it doesn't stop at launch: we kept interviewing, testing our own ways of working, and reprioritizing against what we heard.

## One source of truth - trusted by humans, verified by machines.

One language, not four. **Multi-surface design tokens** carry brand and behavior across web, native and content; **Figma variables** hold the component architecture on the design side; **Storybook** is the engineering source of truth on the code side.

And trust doesn't mean unchecked: every pull request runs **automated conformity checks before a double human validation**, and **Chromatic** catches visual regressions before they ship. I ran the team on live signal too - **DORA metrics every sprint**, satisfaction surveys, ritual feedback - read as decisions, not dashboards for show. Automate the repeatable, measure what matters, keep the human judgment where it counts. **That's governance you can't skip and don't have to police.**

## Accessibility is the floor. Responsibility is the reach.

**WCAG AA** wasn't our bar - I positioned it as the Sanofi digital standard, the minimum for every product, not just the library. We audited the full library to **100% compliance before our first major**, then held it there through continuous review - axe embedded, Storybook's native checks, manual review on top - so no product team paid the accessibility cost downstream.

But inclusion doesn't stop at who can *use* the product. A system touching 45+ products has a footprint - societal and environmental - and it isn't small. So responsibility was designed in, not bolted on, and it looked like **sobriety** at every level.

Sobriety, at every level.

**Light — by default.**

Smallest possible package weight, and modular imports - teams pulled only the components they needed, never the whole library, so production sites stayed lean. A lighter system reaches more people, on more devices, with less energy.

**Quiet — by design.**

The system stayed deliberately sober, so brands could express themselves without fighting it. Restraint as a feature, not a limitation.

**Fewer components — more coverage.**

Simple, flexible component architectures - the smallest set that meets the widest need, instead of a library that sprawls. Same for patterns: I ran a rationalization pass to keep them coherent across every product and positioned as standards.

## AI should earn trust, not exploit it.

When AI entered the digital roadmap, most teams asked what it could *do*. I asked what it should *never* do - and put that on the table first.

Before shipping AI-assisted features, I've asked the team to investigate, test prior to rolling anything at scale - to keep consistency, value and on-brand positioning across every product. AI wasn't just a new technology to embrace, but more a tool to add to our stack with responsible usage. And so got the community of practice sensitized too.

An AI that nudges, manipulates, anchors on dark patterns or manufactures urgency isn't a feature, it's a breach of trust - and in healthcare, that trust isn't abstract. **It starts with an employee and it finishes with a patient.**

Not everyone shares this as a priority. I do. A system that shapes how people interact with their health has no business optimizing for engagement over honesty. Coherent and on-brand is the baseline. **Ethical is the standard.**

## We break nothing without a bridge.

With that many products depending on us, a careless breaking change is a tax paid 45 times over. So: **one major release a year, maximum** - protected, deliberate - and a steady cadence of improvements and fixes, roughly **one release per two-week sprint**.

When a breaking change was unavoidable, we shipped a **patch path** alongside it and left product teams a real buffer to upgrade on their own schedule. The documentation was industrialized to match - at the component and the library level - structured to keep side effects from ever surprising a consumer.

Same principle, top to bottom: everyone - leaders, practitioner, teammate - gets to own their part.

## Support on their terms, not mine.

The system serves the people building on it, so support flexed to them, not the other way around. **Office hours** for whoever wanted synchronous help; **asynchronous support** for whoever needed to move on their own clock - product teams kept full control over the urgency of their own problems.

And communication was built to outgrow me. I kept it proactive and regular, but the point was always for the community to take the mic: **members carrying the messages, answering each other directly**, becoming the channel instead of routing everything through me.

## A team of owners, not a team of hands.

Inside the team, ownership was structural, not a pep talk. The **support lead rotated every sprint** - a model we didn't guess at but iterated into, reading the support and satisfaction data until the rotation was what the signal asked for - so responsibility, and recognition as the identified point of contact, moved around and no one got stuck in execution. Roles rotated. **Sprint planning was collective**, **retros ran every sprint**, and I sat in on the **dailies** as often as I could - mostly to absorb the hot updates coming down, so the team could stay in the work instead of the noise.

All of it lived on **Confluence**, documented like a team mantra - so a new joiner became an owner fast, and the rest of Sanofi could see exactly how we worked. **Transparency wasn't a value on a wall. It was the onboarding.**

And growth didn't run top-down. It ran through the community: people levelled up by contributing, teaching, carrying the message - and I grew as much through them. **Reverse mentoring by practice** isn't a nice idea to me, it's how a system stays honest: the day you think you're the one who knows, you've stopped listening. *I lead, and I stay a student.*

That's not the soft version of leadership. It's the *operating system*.
