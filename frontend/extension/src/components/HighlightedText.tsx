import { Typography } from "@mui/material";

interface Props {
  text: string;
  keywords: string[];
  onClick: (term: string) => void;
}

export default function HighlightedText({ text, keywords, onClick }: Props) {
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = keywords.map(escapeRegex).join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));

  return (
    <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
      {parts.map((part, idx) => {
        const isKeyword = keywords.some((kw) => kw.toLowerCase() === part.toLowerCase());
        return isKeyword ? (
          <button
            key={idx}
            onClick={() => onClick(part)}
            style={{
              backgroundColor: "#e3f2fd",
              border: "none",
              borderRadius: "4px",
              padding: "0.1rem 0.4rem",
              margin: "0 2px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#0d47a1",
            }}
          >
            {part}
          </button>
        ) : (
          <span key={idx}>{part}</span>
        );
      })}
    </Typography>
  );
}
