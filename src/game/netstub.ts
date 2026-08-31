/** Local-only play. Networked matches are intentionally not required to ship. */
export interface NetcodeStub {
  kind: "local-bots";
  note: string;
  connect(): Promise<never>;
}

export const NETCODE: NetcodeStub = {
  kind: "local-bots",
  note: "Yardfrag ships with local bot opponents. Authoritative client-server netcode, snapshots, and lag compensation are stubbed here so the playable loop is not blocked on multiplayer.",
  connect: () =>
    Promise.reject(new Error("Multiplayer is not wired. Use local bots.")),
};
