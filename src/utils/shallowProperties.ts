import pick from 'lodash/pick';
import omit from 'lodash/omit';

// The standalone lodash packages treated dots and brackets as literal keys.
// One-element paths preserve that behavior with the maintained implementation.
// The legacy declaration overloads cannot express this nested path-list shape.
export function pickProperties(object: any, keys: Array<string>) {
  return pick(
    object,
    keys.map((key) => [key]) as any
  );
}

export function omitProperties(object: any, keys: Array<string>) {
  return omit(
    object,
    keys.map((key) => [key]) as any
  );
}
