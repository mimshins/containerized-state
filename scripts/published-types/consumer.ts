// Compiled against the built packages, the way an installed project sees them.
// The workspace's own `tsc` maps `containerized-state` to its source, so it sees
// one `Container` even when each package ships its own declaration of it.
import {
  PersistentContainer,
  withPersistence,
} from "containerized-state-plugin-persistence";
import {
  Container,
  useComputedValue,
  useValue,
} from "react-containerized-state";

const storage = {} as Storage;
const config = { key: "key", storage };

export const fromContainer = withPersistence(Container.create(0), config);
export const fromClass = new PersistentContainer(0, config);

export const useBoth = (): [number, boolean] => [
  useValue(fromContainer),
  useComputedValue(fromClass, value => value > 0),
];
