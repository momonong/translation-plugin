import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText
  } from "@mui/material";
  import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
  
  interface RelationItem {
    source: string;
    target: string;
    weight: number;
  }
  
  interface RelationGroup {
    relation: string;
    items: RelationItem[];
  }
  
  interface Props {
    term: string;
    groups: RelationGroup[];
    onTermClick: (term: string) => void;
  }
  
  export default function RelatedTerms({ term, groups, onTermClick }: Props) {
    return (
      <div>
        <Typography variant="h6" gutterBottom>
          📌 「{term}」的語意關係：
        </Typography>
  
        {groups.map((group, idx) => (
          <Accordion key={idx} defaultExpanded={idx === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                {group.relation}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {group.items.map((item, i) => {
                  const nextTerm = item.source === term ? item.target : item.source;
                  return (
                    <ListItem key={i} disablePadding>
                      <ListItemButton onClick={() => onTermClick(nextTerm)}>
                        <ListItemText primary={nextTerm} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    );
  }
  