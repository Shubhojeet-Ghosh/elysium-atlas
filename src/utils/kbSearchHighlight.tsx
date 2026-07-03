import { Fragment } from "react";

export function highlightKbSearchMatch(text: string, term: string) {
  if (!term.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);

  if (index === -1) return text;

  const beforeMatch = text.substring(0, index);
  const match = text.substring(index, index + term.length);
  const afterMatch = text.substring(index + term.length);

  return (
    <Fragment>
      {beforeMatch}
      <span className="bg-serene-purple/80 text-white font-semibold">
        {match}
      </span>
      {afterMatch}
    </Fragment>
  );
}
