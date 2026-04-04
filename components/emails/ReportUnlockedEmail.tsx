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

interface ReportUnlockedEmailProps {
  reportUrl: string;
}

export const ReportUnlockedEmail = ({
  reportUrl,
}: ReportUnlockedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Investor-Ready Report is Unlocked</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>FUNDABILITYOS</Heading>
          
          <Section style={contentSection}>
            <Text style={h2}>Your report is ready.</Text>
            <Text style={text}>
              Thank you for purchasing the FundabilityOS Investor-Ready report. 
              Your detailed gap analysis, investor pushback expectations, and custom 30-Day Growth Plan have been successfully unlocked.
            </Text>
            
            <Section style={buttonContainer}>
              <Link href={reportUrl} style={button}>
                ACCESS FULL REPORT
              </Link>
            </Section>
            
            <Text style={text}>
              You can bookmark that link and send it directly to Angels or VCs to prove your traction and problem clarity.
              If you have any questions, simply reply to this email.
            </Text>
            
            <Text style={footerText}>
              Built by NextBlaze Asia for Southeast Asian founders.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ReportUnlockedEmail;

const main = {
  backgroundColor: "#f4f6f8",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#022F42", // var(--navy)
  margin: "40px auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  overflow: "hidden",
};

const h1 = {
  color: "#FACC15", // var(--yellow)
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
