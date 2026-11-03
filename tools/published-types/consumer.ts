// Compiled against the packed tarballs in a real node_modules, the way an
// installed project sees them (tools/check-packages.ts). The workspace's own
// `tsc` maps `containerized-state` to its source, so it sees one `Container`
// even when each package ships its own declaration of it; this file does not.
import {
  PersistentContainer,
  withPersistence,
} from "containerized-state-plugin-persistence";
import {
  Container,
  useComputedValue,
  useValue,
} from "react-containerized-state";

const storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
const config = { key: "key", storage };

export const fromContainer: PersistentContainer<number> = withPersistence(
  Container.create(0),
  config,
);
export const fromClass = new PersistentContainer(0, config);

export const useBoth = (): [number, boolean] => [
  useValue(fromContainer),
  useComputedValue(fromClass, value => value > 0),
];
