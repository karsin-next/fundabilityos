import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DiagnosticCompleteEmailProps {
  score: number;
  band: string;
  reportUrl: string;
}

export const DiagnosticCompleteEmail = ({
  score,
  band,
  reportUrl,
}: DiagnosticCompleteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Fundability Score is {score}/100 ({band})</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>FUNDABILITYOS</Heading>
          
          <Section style={contentSection}>
            <Text style={h2}>Diagnostic Complete.</Text>
            <Text style={text}>
              The AI Engine has finished analyzing your startup data. Your initial Fundability Score has been calculated:
            </Text>
            
            <div style={scoreBox}>
              <Text style={scoreNumber}>{score}</Text>
              <Text style={scoreBand}>{band}</Text>
            </div>
            
            <Text style={text}>
              You can view your high-level gap analysis and top investor concerns in your dashboard. To see the full breakdown and get your 30-Day Growth Plan, unlock the full report.
            </Text>
            
            <Section style={buttonContainer}>
              <Link href={reportUrl} style={button}>
                VIEW DIAGNOSTIC RESULT
              </Link>
            </Section>
            
            <Text style={footerText}>
              Built by NextBlaze Asia for Southeast Asian founders.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DiagnosticCompleteEmail;

const main = {
  backgroundColor: "#f4f6f8",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#022F42",
  margin: "40px auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  overflow: "hidden",
};

const h1 = {
  color: "#FACC15",
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "0.5px",
  textAlign: "center" as const,
  padding: "30px 20px",
  margin: "0",
};

const contentSection = {
  backgroundColor: "#ffffff",
  padding: "40px",
  borderRadius: "8px 8px 0 0",
};

const h2 = {
  color: "#022F42",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 20px",
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "24px",
};

const scoreBox = {
  backgroundColor: "rgba(2,47,66,0.03)",
  border: "1px solid rgba(2,47,66,0.1)",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const scoreNumber = {
  fontSize: "48px",
  fontWeight: "900",
  color: "#022F42",
  margin: "0 0 8px",
};

const scoreBand = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#FACC15",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0",
  backgroundColor: "#022F42",
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "4px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#FACC15",
  borderRadius: "4px",
  color: "#022F42",
  fontSize: "15px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
};

const footerText = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "20px",
  textAlign: "center" as const,
  marginTop: "48px",
};
