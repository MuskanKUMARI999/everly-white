export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "list"; items: string[] };

export interface BlogPost {
  id: string;
  /** URL slug used for the article route (/blog/{slug}) — stable and SEO-friendly. */
  slug: string;
  title: string;
  category: "Rituals" | "Studio Notes" | "Care & Craft" | "Gifting";
  excerpt: string;
  content: BlogContentBlock[];
  image: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
}

export const posts: BlogPost[] = [
  {
    id: "11",
    slug: "designed-to-change-how-you-experience-life",
    title: "How Everly White Studios Is Designed to Change the Way You Experience Life",
    category: "Studio Notes",
    excerpt:
      "Every piece we make begins as a question about how a room should feel, not just how it should look. A look inside the philosophy behind the studio.",
    content: [
      {
        type: "paragraph",
        text: "Most homes are decorated. Ours are designed to be felt. When we sit down with a new piece — long before a single glaze is mixed — the question we ask isn't \"how should this look on a shelf,\" it's \"how should the room feel five minutes after someone notices it.\" That's a harder question to answer than it sounds, and it's the one that decides whether a design moves forward or gets set aside for another year.",
      },
      {
        type: "paragraph",
        text: "That distinction shapes everything: the weight of a plate in your hand, the way light catches a raised motif at dusk, the quiet permission an object gives you to slow down. Laid-Back Luxury isn't a tagline for us — it's closer to a design constraint, the same way a load limit constrains an engineer. If a piece doesn't invite you to exhale, it doesn't leave the studio, no matter how technically accomplished the carving or how rare the finish.",
      },
      { type: "heading", text: "The Five-Minute Test" },
      {
        type: "paragraph",
        text: "In practice, this means every new design goes through what we internally call the \"five-minute test.\" We place a prototype in an ordinary room — not a styled shoot, just someone's actual living room — and leave it there for a week. We ask what happened around it: did anyone touch it without meaning to? Did it get moved, or did it settle into a spot and stay? A piece that gets relocated after day two usually isn't finished. A piece that quietly becomes \"where the keys go\" has passed.",
      },
      {
        type: "image",
        src: "/images/instagram/product-coffee-table.jpg",
        alt: "Everly White plates styled on a coffee table in a lived-in room",
        caption: "A piece that quietly becomes part of a room has passed the test.",
      },
      {
        type: "paragraph",
        text: "The materials matter as much as the test. We work almost exclusively in hand-carved wood and hand-set mirror inlay, partly because both age instead of degrading — a wood grain deepens, a mirror edge softens — and partly because both require a human hand at every stage, which keeps a limit on how fast we can grow. That limit used to frustrate us. Now we think of it as the actual product: not the plate itself, but the pace at which it was allowed to be made.",
      },
      { type: "heading", text: "Made to Be Lived With, in Pairs" },
      {
        type: "paragraph",
        text: "This is also why so much of what we make comes in pairs, rather than as single hero objects. A home is lived in by more than one mood in a week, and often by more than one person. Twin Flames and Lunar Bond were both built around that idea — two vessels that only feel complete standing near each other, a small, physical argument against the instinct to buy one perfect thing and be done.",
      },
      {
        type: "paragraph",
        text: "Our founder often says the studio exists to slow down a transaction most retailers are trying to speed up. A five-minute checkout is good business. A five-minute pause in front of an object, deciding whether it belongs in your home, is a different kind of good — one that doesn't show up on a conversion dashboard but shows up, eventually, in whether someone still loves the piece three years later.",
      },
      {
        type: "paragraph",
        text: "So when you bring an Everly White piece home, you're not just filling a surface. You're setting the tone for how that corner of the room gets used — for the coffee poured slowly, the phone left in another room, the five minutes that used to disappear into a scroll and now don't. That's a bigger claim for a ceramic plate to carry than most brands would make, and we don't make it lightly.",
      },
      {
        type: "paragraph",
        text: "We're aware that all of this can sound like a lot of meaning to hang on an object you might use to hold a set of keys or a candle. But that's rather the point: the meaning was there before we designed anything. Our job was just to make something sturdy enough, and quiet enough, to hold it.",
      },
    ],
    image: "/images/instagram/lifestyle-sofa.jpg",
    date: "June 18, 2026",
    readTime: "6 min read",
    author: "The Everly White Studio",
    authorRole: "Studio Team",
  },
  {
    id: "9",
    slug: "slow-morning-ritual",
    title: "The Slow Morning Ritual: Setting Your Altar Before Sunrise",
    category: "Rituals",
    excerpt:
      "A quiet practice for the first ten minutes of the day — light, water, and a single object chosen with intention.",
    content: [
      {
        type: "paragraph",
        text: "There's a specific kind of quiet that only exists before 6 a.m. — before notifications, before anyone else in the house is awake, before the day has asked anything of you yet. This ritual is built for that window, and for the ten minutes most of us give away to a phone before we've even stood up.",
      },
      { type: "heading", text: "Begin With Light, Not Sound" },
      {
        type: "paragraph",
        text: "Start with light, not sound. A single candle, or the first grey light through an east-facing window, is enough — resist the urge to switch on an overhead. Overhead light announces the day; a single low source lets you ease into it instead. If your room doesn't face east, a small lamp on its lowest setting does the same job, as long as it doesn't reach every corner.",
      },
      {
        type: "paragraph",
        text: "Set out one object with intention — a small dish for rings, a shallow bowl to hold whatever's in your pockets — and let it be the only thing on the surface. Clear everything else away the night before, so the surface is empty when you sit down with it. Our Lunar Bond pieces were designed with exactly this kind of morning in mind: quiet, load-bearing, unhurried, built to hold one object well rather than several objects adequately.",
      },
      {
        type: "image",
        src: "/images/instagram/product-display.jpg",
        alt: "A single Everly White dish set out with intention",
        caption: "One object, chosen with intention — and nothing else on the surface.",
      },
      { type: "heading", text: "Water, Attention, and the Right Corner" },
      {
        type: "paragraph",
        text: "Add water next. A glass, poured and left untouched for a minute before you drink it, does something a rushed sip never will — it gives your hands one job with no urgency attached to it. This is a small, almost silly-sounding practice, and it is also one of the few parts of this ritual that has genuinely changed how our mornings feel, enough that half the studio has adopted some version of it without being asked to.",
      },
      {
        type: "paragraph",
        text: "Then, if there's time, sit with the piece nearest you — a Star Crossed Lovers dish, a small tray — and notice it before you notice your phone. Run a finger along the carved edge. Ask, honestly, whether it's in the right spot, or whether it's been sitting somewhere convenient rather than somewhere considered. Altars, in most traditions this ritual borrows loosely from, are moved and adjusted constantly. Ours should be too.",
      },
      {
        type: "paragraph",
        text: "None of this is prescriptive in a strict sense — there's no wrong way to do ten quiet minutes. What we've noticed, informally, is that the people who keep this practice longest are the ones who resist turning it into a checklist. The moment \"light a candle, set an object, pour water, sit for a minute\" becomes four boxes to tick, the ritual stops working, because the entire value was in the unhurried attention, not the sequence.",
      },
      {
        type: "paragraph",
        text: "The practice also shifts with the season, and that's fine. In winter, when 6 a.m. is still fully dark, the candle does more work and the water step might move later, once there's actual light to sit in. In summer, when the sun is already up by 5:30, you may only get three or four unhurried minutes before the house wakes — take them anyway. Ten minutes is a target, not a minimum requirement.",
      },
      {
        type: "paragraph",
        text: "Where you set this up matters more than what you put on it. A corner that already collects clutter — mail, keys, whatever gets dropped on the way in the door — will absorb your altar into that same pile within a week. Choose a surface that has no other job: a windowsill rather than the kitchen counter, a small shelf rather than the entryway table everyone touches on the way past. The object needs a spot that's already quiet before it can hold anything.",
      },
      { type: "heading", text: "The Ritual, in Four Steps" },
      {
        type: "list",
        items: [
          "Light a single candle, or sit in the first low light of the morning.",
          "Set out one object with intention, and keep the surface otherwise clear.",
          "Pour a glass of water and let it rest a moment before you drink.",
          "Sit with the piece nearest you before you reach for your phone.",
        ],
      },
      {
        type: "paragraph",
        text: "None of this takes more than ten minutes on a good day. But it changes the shape of the hour that follows, and the pieces you choose for it matter more than they seem to at 5:45 in the morning, half-asleep, deciding whether this is worth doing before coffee. It is.",
      },
    ],
    image: "/images/instagram/insta-window.jpg",
    date: "June 5, 2026",
    readTime: "6 min read",
    author: "Meera Anand",
    authorRole: "Co-Founder & Creative Director",
  },
  {
    id: "8",
    slug: "behind-the-kiln-hand-finished",
    title: "Behind the Kiln: How Each Piece Is Hand-Finished",
    category: "Care & Craft",
    excerpt:
      "No two glazes fire the same way twice. We spent a morning with our ceramicists to understand why that's the point, not the flaw.",
    content: [
      {
        type: "paragraph",
        text: "Every Everly White piece passes through the same kiln, on the same days, fired at nearly identical temperatures — and no two come out the same. That's not a quality gap we're working to close. It's the reason the work looks handmade, because it is, and because every stage before the fire involves a decision a machine would make identically every time and a person makes slightly differently.",
      },
      { type: "heading", text: "Carved and Inlaid by Hand" },
      {
        type: "paragraph",
        text: "Before firing, each plate is hand-carved and inlaid, piece by piece, by a ceramicist who has usually made hundreds of the same design and still checks every one under a raking light before it's approved. The carving alone takes the better part of a day for a large plate — a fine chisel, worked at an angle that changes slightly with the grain of the wood, following a pattern that's been drawn but never stenciled.",
      },
      {
        type: "paragraph",
        text: "The mirror inlay is its own separate skill, and it's usually done by a different person than the one who carved the piece. Small mirror fragments, cut to size by hand, are set one at a time into the carved recesses with a natural adhesive, then pressed and checked from several angles before the adhesive sets. A single large plate can hold anywhere from sixty to over a hundred individual mirror pieces, each one placed to catch light from a slightly different angle than its neighbor.",
      },
      {
        type: "image",
        src: "/images/instagram/product-marble-counter.jpg",
        alt: "A finished Everly White plate with hand-set mirror inlay",
        caption: "Sixty to a hundred mirror fragments, each set by hand.",
      },
      { type: "heading", text: "Why No Two Are the Same" },
      {
        type: "paragraph",
        text: "Small variations in glaze pooling, in the depth of a carved line, in how the mirror inlay catches — these aren't flaws to hide. They're the fingerprint of the hand that made it, and after enough time in the studio, we can often tell which of our three senior ceramicists carved a particular piece just from the angle of a single motif, the same way you'd recognize a friend's handwriting.",
      },
      {
        type: "paragraph",
        text: "Butterfly Effect and String of Fate are two of the pieces where this shows up most, since both rely on fine, repeated linework that a machine would render identically every time — and that identical repetition is exactly what would make them feel cold. A laser-cut version of either design exists in theory; we've been asked to make one, for a corporate order that wanted absolute uniformity, and we turned it down.",
      },
      {
        type: "paragraph",
        text: "New ceramicists join the studio as apprentices for close to a year before they carve anything that ships. Most of that time is spent on offcuts and seconds — pieces that will never leave the building — practicing the same handful of motifs until the chisel angle stops requiring conscious thought. We've tried shortening this before, during a stretch when demand outpaced our carving capacity. The seconds pile from that period is still the largest one we've ever had.",
      },
      {
        type: "paragraph",
        text: "We spent a morning in the studio watching this process from raw clay to final glaze. What struck us most wasn't the skill, though there's plenty of it — it was how unbothered everyone was by the small differences. \"If you wanted it perfect,\" one of our ceramicists told us, \"you'd buy something else.\" She said it without any defensiveness, the way you'd state a fact about the weather.",
      },
      {
        type: "paragraph",
        text: "Kiln day itself is its own quiet ritual. Pieces go in stacked according to a loading plan that's been refined over years — certain glazes need more airflow, certain shapes shadow their neighbors if placed wrong — and then there's a wait of roughly fourteen hours before anyone can open the door and see what actually happened. Every ceramicist we've asked describes some version of the same feeling on kiln day: quiet nerves, then relief, then the specific joy of a glaze that pooled somewhere unexpected and looks better for it.",
      },
      {
        type: "paragraph",
        text: "None of this is efficient, and we've made peace with that. A larger studio, chasing faster output, would automate the carving first and the mirror-setting second, and the work would look it. We'd rather make fewer plates, slower, and have each one worth the fourteen-hour wait to see how the kiln treated it.",
      },
    ],
    image: "/images/instagram/craft-process.jpg",
    date: "May 22, 2026",
    readTime: "7 min read",
    author: "The Everly White Studio",
    authorRole: "Studio Team",
  },
  {
    id: "7",
    slug: "gifting-across-the-threshold-of-change",
    title: "A Guide to Gifting Across the Threshold of Change",
    category: "Gifting",
    excerpt:
      "Housewarmings, new chapters, quiet goodbyes — how to choose a piece that says more than a card can.",
    content: [
      {
        type: "paragraph",
        text: "The gifts that matter most tend to arrive at thresholds — a first apartment, a marriage, a loss, a long-distance goodbye. These aren't \"happy occasion\" gifts in the ordinary sense; they're markers for a life that's about to be different than it was, and most of us are underprepared to choose well for them, because greeting card aisles are built for anniversaries, not thresholds.",
      },
      { type: "heading", text: "Choosing for the Threshold" },
      {
        type: "paragraph",
        text: "For a housewarming, we point people toward Twin Flames — two pieces meant to be placed together, which quietly says the home is now shared, even if it's shared with just one person and a cat. There's something specific about giving a pair rather than a single object at this moment: it implies the space is going to hold more than one story, which is exactly what a first apartment is meant to do, even before the boxes are unpacked.",
      },
      {
        type: "paragraph",
        text: "For a goodbye or a long-distance move, String of Fate carries that meaning more directly: a thread connecting two points that are about to be far apart. We've shipped this piece to a lot of addresses that used to be the same city as the recipient's closest friend, and more than once we've had someone email us afterward just to say the piece arrived on the right day, which matters more than it should for an object that can't actually know what day it is.",
      },
      {
        type: "paragraph",
        text: "For a harder threshold — a loss, a hard year, a season someone is trying to move through — Star Crossed Lovers works differently. It isn't a gift that tries to fix anything, and we'd gently discourage choosing a gift that tries to. It's an object that just sits there, steady, for as long as it's needed, without asking the person holding it to feel better on any particular schedule.",
      },
      {
        type: "image",
        src: "/images/instagram/lifestyle-sofa.jpg",
        alt: "A pair of Everly White plates styled in a living room",
        caption: "A pair says the space is meant to hold more than one story.",
      },
      { type: "heading", text: "A Quick Guide by Occasion" },
      {
        type: "list",
        items: [
          "Housewarming — Twin Flames, a pair for a newly shared space.",
          "A long-distance goodbye — String of Fate, a thread across the distance.",
          "A hard season — Star Crossed Lovers, steady and undemanding.",
          "A corporate milestone — a considered pair, never something generic.",
        ],
      },
      {
        type: "paragraph",
        text: "A slightly different version of this same logic applies to corporate gifting, which we get asked about more than almost anything else. A client anniversary, a retiring executive, a team that just closed out a hard year together — these are thresholds too, even in a professional context, and the instinct to reach for something generic undersells the moment. We've built entire small collections around single corporate milestones, and the brief is always the same: choose for what's actually changing, not for what's easy to order in bulk.",
      },
      {
        type: "paragraph",
        text: "If you're choosing without us — and you don't need to buy from Everly White to use this thinking — start by naming the threshold out loud before you shop. \"This is for someone whose parent just moved into assisted living\" is a different brief than \"this is for someone who had a baby,\" even though both might land in a gift-guide's \"life milestones\" category. The specificity is the whole exercise.",
      },
      {
        type: "paragraph",
        text: "Presentation matters more at a threshold than at an ordinary gift moment, too. We ship every piece in a branded box with the two halves nested together rather than boxed separately, because unboxing them apart undercuts the whole point before the recipient even picks either one up. If you're gifting anything meant to be read as a pair, from us or anywhere else, wrap it as one gift, not two.",
      },
      {
        type: "paragraph",
        text: "Whatever the occasion, the instinct we'd encourage is the same: choose for the threshold, not just the date on the calendar. A card says congratulations. The right piece says we see what's actually changing for you — and that distinction, more than price or size or brand, is what people remember years after the actual date has been forgotten.",
      },
    ],
    image: "/images/instagram/insta-card.jpg",
    date: "May 10, 2026",
    readTime: "6 min read",
    author: "Rhea Kapoor",
    authorRole: "Brand & Content Lead",
  },
  {
    id: "6",
    slug: "living-in-cosmic-time",
    title: "Living in Cosmic Time: Why We Design Around the Moon",
    category: "Studio Notes",
    excerpt:
      "Our collections follow lunar phases, not seasons. Here's what that means for the way a piece is meant to be lived with.",
    content: [
      {
        type: "paragraph",
        text: "Seasons are useful for planting and for weather. They're less useful for describing how a person actually feels from one week to the next. That's part of why our design calendar follows lunar phases instead — twenty-nine days, waxing to waning, rather than four blunt quarters that treat January and March as the same undifferentiated stretch of winter.",
      },
      { type: "heading", text: "An Object Shaped Like the Moon" },
      {
        type: "paragraph",
        text: "Lunar Bond was the first piece designed explicitly around this idea: two halves of a single form that only read as complete when placed close together, the way a moon only reads as full for the one or two nights it actually is. Every other night of the month, it's something else — waxing, waning, a sliver, dark entirely — and we wanted an object that carried that same sense of a shape that's usually incomplete and occasionally, briefly, whole.",
      },
      {
        type: "paragraph",
        text: "In practice, this shows up less in the pieces themselves and more in when we release them. New work tends to land near a new moon — a quiet, unannounced start, the astronomical equivalent of a blank page — rather than tied to a retail calendar that has nothing to do with how the piece was actually made. We've released a collection during a full moon exactly once, deliberately, for a piece that was specifically about completion, and it felt right in a way that's hard to justify on a spreadsheet but obvious in the studio.",
      },
      {
        type: "image",
        src: "/images/instagram/lifestyle-sofa.jpg",
        alt: "Everly White pieces in a calm, lived-in room",
        caption: "New work tends to land near a new moon — a quiet, unannounced start.",
      },
      { type: "heading", text: "Cyclical Time, Not Retail Time" },
      {
        type: "paragraph",
        text: "This calendar also changes the internal rhythm of the studio in ways that are easy to miss from the outside. A twenty-nine day cycle doesn't map neatly onto a thirty- or thirty-one-day month, which means our production schedule drifts slightly against the regular calendar year over year — a piece that launched near a new moon in March might launch nearer the end of the month the following year. We've stopped trying to correct for this. It's a feature of working in cosmic time rather than retail time.",
      },
      {
        type: "paragraph",
        text: "Most people who bring a piece home never think about which lunar phase it launched in, and that's fine — this isn't a mechanism we expect customers to track. But it changes the pace of the studio itself, and we think the pace shows up in the work, the same way you can often tell when a dish was cooked in a rush versus cooked with time to actually taste it along the way.",
      },
      {
        type: "paragraph",
        text: "There's a broader idea underneath all of this, which is that a lot of modern life treats time as linear and disposable — a quarter closes, a year ends, a to-do list resets to zero. Lunar time doesn't work that way. It's cyclical, and it insists that the version of a phase you're in right now has happened before and will happen again, which is either a comforting thought or an unsettling one depending on the week you're having. We've chosen to find it comforting, and we've built a design practice around that choice.",
      },
      {
        type: "paragraph",
        text: "If you want to borrow this idea without redesigning your entire calendar, the simplest version is just noticing the moon for thirty seconds before bed, a handful of nights a month. You don't need an app for it, and you don't need to know the exact phase name. You just need to look up occasionally and register that the sky, like everything else worth paying attention to, is mid-cycle rather than finished.",
      },
      {
        type: "paragraph",
        text: "None of this makes for an efficient production calendar, and a few advisors over the years have suggested we switch to something more conventional. We're keeping the moon. It's slower, it's a little impractical, and it's the reason the studio still feels like it's making things for a specific, felt stretch of time rather than for a quarter on a retail calendar.",
      },
    ],
    image: "/images/instagram/product-coffee-table.jpg",
    date: "April 28, 2026",
    readTime: "6 min read",
    author: "The Everly White Studio",
    authorRole: "Studio Team",
  },
  {
    id: "5",
    slug: "caring-for-glazework",
    title: "Caring for Glazework: A Small Ritual of Its Own",
    category: "Care & Craft",
    excerpt:
      "The right way to clean, store, and live daily with hand-glazed ceramics — so the finish only gets better with age.",
    content: [
      {
        type: "paragraph",
        text: "Hand-glazed ceramics reward a slightly different kind of care than the dishwasher-safe pieces they're standing in for. None of it is complicated, but skipping it is the fastest way to dull a finish that's meant to get better with age, not worse — and unlike most care instructions that come folded inside a box and never read again, this one is short enough to actually remember.",
      },
      { type: "heading", text: "Washing and Drying" },
      {
        type: "paragraph",
        text: "Wash by hand, in lukewarm water, with a soft cloth rather than anything abrasive — the mirror inlay and raised motifs on pieces like Twin Flames and Butterfly Effect are the first place a scouring pad will show damage. Hot water is worth avoiding too, not because it damages the glaze directly, but because rapid temperature changes are what stress a hand-fired finish over years of repeated use. Lukewarm, every time, is the safer habit.",
      },
      {
        type: "paragraph",
        text: "Dry immediately rather than air-drying, especially around any metal or mirrored detail. Air-drying works fine for most dishware, but the mirror fragments set into our pieces sit in tiny recessed pockets that hold moisture longer than the surrounding wood or ceramic, and standing water in those pockets is what eventually clouds the mirror's edge. A soft cloth, immediately after washing, takes care of this in under a minute.",
      },
      {
        type: "image",
        src: "/images/instagram/product-marble-counter.jpg",
        alt: "A hand-glazed Everly White plate on a marble counter",
        caption: "Hand-glazed finishes only get better with a little care.",
      },
      { type: "heading", text: "Storing, Using, and Repairing" },
      {
        type: "paragraph",
        text: "Store pieces with a soft layer between them if they're stacked, and keep them out of direct, sustained sunlight if you can — glaze doesn't fade quickly, but it does fade eventually, particularly the warmer tones in our earlier collections. A felt or cotton layer between stacked plates costs almost nothing and prevents the kind of fine surface scratching that only becomes visible once you tilt a piece toward a lamp and wonder when that happened.",
      },
      {
        type: "paragraph",
        text: "Beyond that, use them. A piece that's handled often develops a softness to its finish that a piece left in a cabinet never will — the same way a well-used wooden spoon looks different from one that's sat in a drawer for a decade. We hear from customers occasionally who feel guilty using a piece daily rather than saving it for special occasions. Please don't. These were made to be lived with, not preserved behind glass.",
      },
      {
        type: "paragraph",
        text: "If a piece does chip or a mirror fragment comes loose over the years — and after enough time, occasionally one will — this is repairable, and we'd rather you reach out to us than replace the piece outright. A loose mirror fragment can usually be re-set with the same natural adhesive used originally, and small chips in the wood can often be filled and re-finished so the repair is barely visible. We're building out a proper restoration service for exactly this, but in the meantime, a message to our care team gets the same result.",
      },
      { type: "heading", text: "A Few Things to Avoid" },
      {
        type: "list",
        items: [
          "Never the dishwasher, even on a gentle cycle.",
          "No commercial wood polish — the silicones build up in carved recesses.",
          "Keep citrus and vinegar-based cleaning sprays away from the finish.",
          "Avoid prolonged, direct sunlight over the years.",
        ],
      },
      {
        type: "paragraph",
        text: "Treat the five minutes of care the same way you'd treat the ritual the piece was designed for in the first place: unhurried, and worth doing properly. It's a small, recurring act of attention, not unlike the mornings and thresholds these pieces are meant to sit inside of — and over years, that attention is exactly what separates a piece that ages well from one that just gets old.",
      },
    ],
    image: "/images/instagram/product-display.jpg",
    date: "April 14, 2026",
    readTime: "6 min read",
    author: "Meera Anand",
    authorRole: "Co-Founder & Creative Director",
  },
  {
    id: "10",
    slug: "twin-flames-one-soul-in-two-bodies",
    title: "TWIN FLAMES (one soul in two bodies)",
    category: "Rituals",
    excerpt:
      "On the collection that started it all — two vessels, always sold and always seen as one.",
    content: [
      {
        type: "paragraph",
        text: "Twin Flames was the piece that started the studio, in the sense that everything since has been an argument with or in agreement with it. Two vessels, cast from the same mold, glazed in the same batch, meant to be sold — and seen — as one object rather than two. Nearly every design decision we've made since traces back to some version of the question this piece first asked: what does it mean to make something that's only complete in relation to something else?",
      },
      { type: "heading", text: "An Idea Older Than the Object" },
      {
        type: "paragraph",
        text: "The idea came from a much older one: that some connections aren't additions to a life but a mirrored half of it, present since before you knew to look for it. We didn't want to illustrate that idea literally. We wanted to make an object that behaved like it — one that looks slightly incomplete on its own, and doesn't need explaining once the second piece is beside it. The first sketches, years ago, tried to be far more literal about this — actual flame motifs, actual mirrored silhouettes — and all of them looked worse the more obvious they became.",
      },
      {
        type: "paragraph",
        text: "What we landed on instead was subtler: a shared carved motif that runs across both plates but only completes its pattern when they're placed a specific distance apart, close enough to read as a pair, far enough that you can tell they're separate objects making a choice to be near each other. Get the spacing wrong and the pattern looks broken rather than intentional — which is, on reflection, a fairly accurate metaphor for the thing itself.",
      },
      {
        type: "image",
        src: "/images/instagram/product-coffee-table.jpg",
        alt: "Twin Flames plates displayed together on a coffee table",
        caption: "Complete only when the two halves stand together.",
      },
      { type: "heading", text: "Why We Won't Sell the Halves Apart" },
      {
        type: "paragraph",
        text: "In the studio, we still refuse to sell the two halves separately, even when a customer only wants one. It isn't a sales tactic, and it's cost us more than one sale over the years from people who genuinely only wanted the smaller piece for a specific spot in their home. It's the entire point of the piece, and the one rule about it we've never seriously reconsidered.",
      },
      {
        type: "paragraph",
        text: "We've heard from customers who bought a pair for themselves, alone, with no partner or specific person in mind — a reminder of a connection to their own past self, or simply a belief that the idea the piece represents doesn't require another person to be true. We've also heard from customers who bought it for a couple going through something difficult, as a quiet vote of confidence that the pull between two people doesn't disappear just because a season gets hard. Both readings are correct. We built the piece to hold more than one interpretation.",
      },
      {
        type: "paragraph",
        text: "The name itself borrows from a much older idea about two souls that are, in some traditions, considered mirrored halves of one original whole — pulled toward each other across distance and difficulty, not because of choice exactly, but because of something closer to gravity. We're careful not to overclaim what an object can actually do here. A plate can't reunite anyone. What it can do is sit in a room and hold that idea quietly, for however long someone needs it to.",
      },
      {
        type: "paragraph",
        text: "Production-wise, Twin Flames remains one of our slower pieces to make, precisely because the two plates have to be carved and fired together to guarantee the glaze reads as a matched pair rather than two similar-but-different objects. We tried, once, sourcing the smaller plate from a faster batch to speed up fulfillment during a particularly busy season. The mismatch was subtle but real, and we scrapped the entire batch rather than ship it. That decision cost us a difficult few weeks of backorders. We'd make it again.",
      },
      {
        type: "paragraph",
        text: "Three years and several collections later, Twin Flames remains the one design we'd point to first if someone asked what Everly White is actually about — not because it's our best-selling piece, though it usually is, but because every other piece we've made since has been, in some way, still answering the question this one first asked.",
      },
    ],
    image: "/images/instagram/product-marble-counter.jpg",
    date: "March 30, 2026",
    readTime: "6 min read",
    author: "Rhea Kapoor",
    authorRole: "Brand & Content Lead",
  },
  {
    id: "4",
    slug: "the-space-between-us-string-of-fate",
    title: "The Space Between Us: On String of Fate and Distance",
    category: "Rituals",
    excerpt:
      "A note on the thread that connects people who are far from each other, and the piece we made to hold that feeling.",
    content: [
      {
        type: "paragraph",
        text: "String of Fate began as a question one of our designers kept turning over: what does an object owe to two people who are no longer in the same city? Most gifts for distance lean sentimental — a photo, a keepsake, something that tries to shrink the gap by reminding you constantly of the person on the other end of it. We wanted something that acknowledged the distance itself, rather than trying to shrink it, which felt more honest even if it was a harder brief to design against.",
      },
      { type: "heading", text: "Designed Around the Distance, Not Against It" },
      {
        type: "paragraph",
        text: "The piece is a single continuous line, split across two small forms, that only completes visually when you know the other half exists somewhere else. Unlike Twin Flames, where the two halves sit close enough to read as an obvious pair, String of Fate's two pieces can sit rooms apart, cities apart, and the design still works — because the thread itself was never meant to be seen in one glance. It's meant to be trusted, the way you trust a phone call is still coming even when the line's gone quiet for a minute.",
      },
      {
        type: "paragraph",
        text: "It isn't meant to be looked at constantly. It's meant to be there — in a hallway, on a shelf — as a kind of standing acknowledgment. Most of our customers tell us they forget it's there for weeks at a time, which we consider a success rather than an oversight. A piece that constantly demanded attention would be exhausting to live with. This one is meant to function more like a low hum in the background of a room, present without asking anything of you.",
      },
      {
        type: "image",
        src: "/images/instagram/insta-window.jpg",
        alt: "An Everly White piece resting quietly on a shelf by a window",
        caption: "Meant to be there — a low hum in the background of a room.",
      },
      { type: "heading", text: "What We've Heard Since" },
      {
        type: "paragraph",
        text: "We've heard from customers who bought a pair for a friend moving abroad, for a parent and a child living in different countries, for two people who used to share an apartment and now share a time-zone difference instead. One customer wrote to us after buying a pair for her sister, who was relocating for a job neither of them had wanted her to take. She said the piece didn't make the move easier, exactly, but it gave the goodbye a shape it hadn't had before — something to hand over instead of just words, which apparently is what the moment actually needed.",
      },
      {
        type: "paragraph",
        text: "Because the two halves of String of Fate are meant to separate — unlike Twin Flames, which we refuse to sell apart — we actually build in slightly more tolerance during firing than we do for our paired pieces. A small variation between the two halves reads as authentic here rather than as a flaw, since the entire idea is two objects living different lives after they leave the studio together. We check for structural soundness far more carefully than we check for an exact match.",
      },
      {
        type: "paragraph",
        text: "There's a broader pattern we've noticed since this piece launched: requests for it spike noticeably around the start and end of academic terms, and again in the weeks around major holidays, which tells us something about when distance is felt most acutely — not during the ordinary stretch of being apart, but at the specific moments when everyone else seems to be arriving somewhere and you're the one staying put, or the one leaving.",
      },
      {
        type: "paragraph",
        text: "It remains one of the quieter pieces in the collection, and one of the ones we hear about the most, usually months after someone bought it — once the distance has actually had time to settle in, and the person holding their half finally understands, in a way they couldn't when they first unwrapped it, what it was actually for.",
      },
    ],
    image: "/images/instagram/insta-chair.jpg",
    date: "March 12, 2026",
    readTime: "6 min read",
    author: "The Everly White Studio",
    authorRole: "Studio Team",
  },
];
