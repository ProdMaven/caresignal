// What each "what came before" tag means, in plain phrases, for semantic matching (FEATURE_SEMANTIC_MATCH).
// A clause of a note is compared with these phrases. The phrases describe the tag being PRESENT; a note that
// says the opposite ("slept well", "no wait") must not match, which is why the threshold is strict.
// English first, then Spanish and Hindi for the tags families mention most. Not reviewed by native speakers.
export const CONTEXT_CONCEPTS: Record<string, string[]> = {
  crowd: ["a crowded place", "too many people around", "it was packed with people", "a busy crowd", "the place was full of people", "había demasiada gente", "estaba lleno de gente", "बहुत भीड़ थी", "bahut bheed thi"],
  loud_noise: ["a loud noise", "it was very noisy", "a loud alarm went off", "loud sounds from a machine", "loud drilling or banging", "había mucho ruido", "bahut shor tha", "बहुत शोर था"],
  poor_sleep: ["slept badly last night", "did not sleep", "awake most of the night", "a bad night of sleep", "kept waking up in the night", "barely slept", "durmió mal anoche", "no durmió", "रात को ठीक से नहीं सोया", "नींद बार-बार टूटी", "raat ko nahi soya"],
  skipped_meal: ["skipped a meal", "barely ate", "did not eat lunch", "ate nothing", "hardly touched the food", "no comió", "casi no comió", "खाना नहीं खाया", "khana nahi khaya"],
  routine_change: ["a change in the usual routine", "something was different from normal today", "a substitute teacher or driver", "the schedule changed", "things were done in a different order", "took a different way than usual", "cambió la rutina", "रोज़ का रूटीन बदल गया"],
  waiting: ["had to wait a long time", "waiting in line for ages", "a long wait for a turn", "kept us waiting for an hour", "tuvo que esperar mucho", "बहुत देर इंतज़ार करना पड़ा"],
  clothing_texture: ["clothes felt scratchy or uncomfortable", "a tag or seam was bothering", "itchy clothing", "the fabric felt wrong", "the sweater felt scratchy", "la ropa le picaba"],
  screen_time_ended: ["screen time ended", "the tablet or TV was turned off", "had to stop the video or game", "no more screen time", "cartoon time was over", "le apagué la tableta"],
  transition: ["moving from one activity to another", "time to stop and go somewhere else", "having to leave a place", "a change of activity"],
  visitor: ["a visitor came to the house", "guests at home", "relatives came to visit", "vino una visita"],
  pain_signs: ["seemed to be in pain", "holding a part of the body that hurts", "wincing or hurting", "pointing to where it hurts"],
  denied_request: ["was told no", "could not have what they asked for", "a request was refused", "was not allowed to"],
  toileting_need: ["needed the toilet", "had to use the bathroom", "was wet or soiled", "needed changing"],
  bathing: ["bath or shower time", "being washed", "getting into the shower"],
  new_person: ["a new person they did not know", "someone unfamiliar", "a new helper or sitter", "met a stranger"],
  woke_from_sleep: ["had just woken up", "woken from a nap", "woke up suddenly", "right after waking"],
  medication_time: ["time to take medicine", "being given tablets", "medication time"],
};
