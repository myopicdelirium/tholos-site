// Services registry. Six slots. One is live. The other five are placeholders
// that hold the page shape until their listings are written, following the
// same convention as the homepage posts filler.

export type Service = {
  number: string;
  slug: string | null;
  title: string;
  line: string;
  price: string;
  duration: string;
  live: boolean;
};

export const services: Service[] = [
  {
    number: "01",
    slug: "mechanism-test",
    title: "Mechanism test",
    line: "You claim a mechanism drives a pattern. We build the minimal working version and report whether the pattern emerges, under criteria signed before anything runs.",
    price: "2,500 to 4,000 EUR",
    duration: "Ten working days",
    live: true,
  },
  {
    number: "02",
    slug: "model-audit",
    title: "Model audit",
    line: "An independent audit of a working model. Verification against documentation, robustness of the headline results, and attribution of the fit to the mechanism.",
    price: "4,000 to 8,000 EUR",
    duration: "Two to three weeks",
    live: true,
  },
  {
    number: "03",
    slug: "discriminating-study",
    title: "Discriminating study",
    line: "Several mechanisms can produce the same pattern. The study determines which candidates can produce yours, where the survivors predict different things, and which one the existing evidence favours.",
    price: "15,000 to 25,000 EUR",
    duration: "Four to eight weeks",
    live: true,
  },
  {
    number: "04",
    slug: null,
    title: "In preparation",
    line: "This listing is not yet public.",
    price: "",
    duration: "",
    live: false,
  },
  {
    number: "05",
    slug: null,
    title: "In preparation",
    line: "This listing is not yet public.",
    price: "",
    duration: "",
    live: false,
  },
  {
    number: "06",
    slug: null,
    title: "In preparation",
    line: "This listing is not yet public.",
    price: "",
    duration: "",
    live: false,
  },
];
