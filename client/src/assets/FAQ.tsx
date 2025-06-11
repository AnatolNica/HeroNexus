import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Container,
  Button,
  Fade,
  Divider,
  useMediaQuery,
} from "@mui/material";
import {
  ExpandMore,
  HelpOutline,
  Forum,
  TravelExplore,
  Payments,
  Language
} from "@mui/icons-material";

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  {
    question: "How do Marvel figurine orders work?",
    answer: "Once you place your order, our team processes it within 1-2 business days. Shipping takes 3-7 days depending on your location.",
    icon: TravelExplore,
  },
  {
    question: "What are the payment methods?",
    answer: "We accept all major credit cards, PayPal, and Stripe payments for safe and fast checkout.",
    icon: Payments,
  },
  {
    question: "How can I track my order?",
    answer: "After purchase, you’ll receive an email with tracking information. You can also check your order status in your account.",
    icon: Forum,
  },
  {
    question: "Are the figurines officially licensed?",
    answer: "Yes, all our Marvel figurines are officially licensed products, ensuring premium quality and authenticity.",
    icon: Language,
  },
  {
    question: "Can I return or exchange a figurine?",
    answer: "Returns are accepted within 14 days of delivery. Figurines must be unopened and in original packaging.",
    icon: HelpOutline,
  },
];

const FAQ: React.FC = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [expanded, setExpanded] = useState<string | false>(false);
  const [allExpanded, setAllExpanded] = useState(false);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const toggleAll = () => {
    setAllExpanded(!allExpanded);
    setExpanded(!allExpanded ? 'all' : false);
  };

  return (
    <Box sx={{
      py: 10,
      backgroundColor: "#121212",
      color: "white",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                mb: 2,
                fontWeight: 800,
                letterSpacing: '-0.05rem',
                color: "white"
              }}
            >
              Marvel Figurines – FAQ
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                mb: 6,
                maxWidth: 600,
                mx: 'auto',
                fontSize: '1.1rem',
                color: "white"
              }}
            >
              Find answers about shipping, payments, returns and everything related to our collectible Marvel figurines.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Button
                variant="outlined"
                onClick={toggleAll}
                sx={{
                  borderRadius: 50,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: "#00C8FF",
                  borderColor: "#00C8FF",
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: "0 2px 8px rgba(0, 200, 255, 0.3)",
                    borderColor: "#00C8FF"
                  }
                }}
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            </Box>

            <Box sx={{
              maxWidth: 800,
              mx: 'auto',
              '& .MuiAccordion-root': {
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                mb: 2,
                backgroundColor: "#1a1a1a",
                color: "white",
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: "0 2px 8px rgba(255, 255, 255, 0.1)"
                },
                '&::before': {
                  display: 'none'
                }
              }
            }}>
              {faqData.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Accordion
                    key={index}
                    expanded={allExpanded || expanded === `panel${index}`}
                    onChange={handleChange(`panel${index}`)}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ color: '#00C8FF' }} />}
                      sx={{
                        py: 1.5,
                        px: 3,
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          gap: 3
                        }
                      }}
                    >
                      <Icon sx={{
                        color: '#00C8FF',
                        fontSize: isMobile ? 24 : 28,
                        minWidth: isMobile ? 30 : 40
                      }} />
                      <Typography variant="h6" sx={{
                        fontWeight: 600,
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        color: "white"
                      }}>
                        {item.question}
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{
                      py: 3,
                      px: isMobile ? 3 : 6,
                      borderTop: `1px solid #333`,
                      backgroundColor: "#1a1a1a"
                    }}>
                      <Box sx={{
                        display: 'flex',
                        gap: 3,
                        '&::before': {
                          content: '""',
                          width: 4,
                          backgroundColor: '#00C8FF',
                          borderRadius: 2,
                          ml: isMobile ? -3 : -6
                        }
                      }}>
                        <Typography
                          variant="body1"
                          sx={{
                            lineHeight: 1.7,
                            fontSize: isMobile ? '0.95rem' : '1rem',
                            color: "white"
                          }}
                        >
                          {item.answer}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>

            <Divider sx={{ my: 8, mx: 'auto', width: '60%', backgroundColor: "#333" }} />

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                maxWidth: 600,
                mx: 'auto',
                fontSize: '1rem',
                color: "white",
                '& a': {
                  color: '#00C8FF',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }
              }}
            >
              Still have questions? <a href="mailto:support@marvelfigures.com">Contact us directly</a> or call us at <a href="tel:+123456789">+40 123 456 789</a>
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default FAQ;
