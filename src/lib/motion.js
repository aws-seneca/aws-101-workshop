// Springs shared across the page. Critically damped (bounce: 0) unless a gesture
// carried momentum, so things settle without wobble.
export const springs = {
  // Moving or repositioning content, like rows sliding up after a delete.
  move: { type: "spring", visualDuration: 0.4, bounce: 0 },
  // Quick press feedback on buttons.
  press: { type: "spring", visualDuration: 0.15, bounce: 0 },
  // A small overshoot for the success check mark.
  fling: { type: "spring", visualDuration: 0.35, bounce: 0.15 },
}
