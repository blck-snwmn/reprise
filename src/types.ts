export type Message =
  | { type: "GET_STATE" }
  | { type: "SET_LOOP"; start: number; end: number }
  | { type: "SET_ENABLED"; enabled: boolean };

export type StateResponse = {
  duration: number;
  start: number;
  end: number;
  enabled: boolean;
};
