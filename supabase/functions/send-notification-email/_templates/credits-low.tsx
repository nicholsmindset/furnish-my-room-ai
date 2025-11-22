import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface CreditsLowEmailProps {
  userName: string;
  creditsRemaining: number;
  planName: string;
}

export const CreditsLowEmail = ({
  userName,
  creditsRemaining,
  planName,
}: CreditsLowEmailProps) => (
  <Html>
    <Head />
    <Preview>Your RoomReimagine credits are running low</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Credits Are Running Low</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>
          You currently have <strong>{creditsRemaining} credits</strong> remaining on your {planName} plan.
        </Text>
        <Text style={text}>
          To continue transforming empty rooms into stunning staged spaces without interruption, consider upgrading to a higher tier plan.
        </Text>
        <Container style={infoBox}>
          <Text style={infoText}>
            <strong>Pro Plan:</strong> 50 designs/month - $29/month
          </Text>
          <Text style={infoText}>
            <strong>Business Plan:</strong> Unlimited designs - $99/month
          </Text>
        </Container>
        <Link
          href={`${Deno.env.get("SITE_URL") || "http://localhost:8080"}/pricing`}
          style={button}
        >
          Upgrade Now
        </Link>
        <Hr style={hr} />
        <Text style={footer}>
          Your credits will reset at the start of your next billing cycle.
        </Text>
        <Text style={footer}>
          <Link
            href={`${Deno.env.get("SITE_URL") || "http://localhost:8080"}/`}
            style={{ ...link, color: "#898989" }}
          >
            RoomReimagine
          </Link>
          , AI-Powered Virtual Staging
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CreditsLowEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#1a1f2e",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 48px",
};

const infoBox = {
  backgroundColor: "#fafbfc",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 48px",
};

const infoText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const button = {
  backgroundColor: "#f59e0b",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "200px",
  padding: "12px 0",
  margin: "24px auto",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const link = {
  color: "#f59e0b",
  textDecoration: "underline",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 48px",
};
