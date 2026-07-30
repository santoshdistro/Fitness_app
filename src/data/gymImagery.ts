// Free stock gym photography (Unsplash, free to use / hotlink). Every photo is
// layered OVER a solid gradient, so if a URL ever fails to load the gradient
// still carries the design — the imagery is pure garnish, never load-bearing.

function unsplash(id: string, w = 600): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
}

/** Wide, motivational banner for the Home hero. */
export const HERO_IMAGE = unsplash('1534438327276-14e5300c3a48', 1000);

/** Photo per goal-program id (keys match GOAL_PROGRAMS ids). */
export const GOAL_PROGRAM_IMAGES: Record<string, string> = {
  muscle_building: unsplash('1532029837206-abbe2b7620e3'),
  chest: unsplash('1571019614242-c5c5dee9f50b'),
  arms: unsplash('1581009146145-b5ef050c2e1e'),
  back: unsplash('1541534741688-6078c6bfb5c5'),
  shoulders: unsplash('1532029837206-abbe2b7620e3'),
  legs: unsplash('1434608519344-49d77a699e1d'),
  weight_loss: unsplash('1571019613454-1cb2f99b2d8b'),
  six_pack: unsplash('1571731956672-f2b94d7dd0cb'),
};

/** Recipe / nutrition imagery for the Handbook tab. */
export const NUTRITION_HERO_IMAGE = unsplash('1490645935967-10de6ba17061', 1000);
