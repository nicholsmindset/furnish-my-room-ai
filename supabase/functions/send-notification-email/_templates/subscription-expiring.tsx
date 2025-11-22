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

interface SubscriptionExpiringEmailProps {
  userName: string;
  planName: string;
  expirationDate: string;
  daysRemaining: number;
}

export const SubscriptionExpiringEmail = ({
  userName,
  planName,
  expirationDate,
  daysRemaining,
}: SubscriptionExpiringEmailProps) => (
  <Html>
    <Head />
    <Preview>Your RoomReimagine subscription is expiring soon</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Subscription Is Expiring Soon</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>
          Your {planName} subscription will expire in <strong>{daysRemaining} days</strong> on {expirationDate}.
        </Text>
        <Text style={text}>
          Don't lose access to professional virtual staging! Renew your subscription to continue transforming empty rooms into stunning staged spaces.
        </Text>
        <Container style={warningBox}>
          <Text style={warningText}>
            After your subscription expires, you'll be moved to the Free plan with only 3 designs per month.
          </Text>
        </Container>
        <Text style={text}>
          Keep your {planName} benefits:
        </Text>
        <ul style={list}>
          <li style={listItem}>
            {planName === "Pro" ? "50 designs/month" : "Unlimited designs"}
          </li>
          <li style={listItem}>
            {planName === "Pro" ? "4K Ultra HD quality" : "8K resolution"}
          </li>
          <li style={listItem}>Priority generation</li>
          <li style={listItem}>All premium features</li>
        </ul>
        <Link
          href={`${Deno.env.get("SITE_URL") || "http://localhost:8080"}/pricing`}
          style={button}
        >
          Renew Subscription
        </Link>
        <Hr style={hr} />
        <Text style={footer}>
          Questions? <Link href={`${Deno.env.get("SITE_URL") || "http://localhost:8080"}/`} style={link}>Contact support</Link>
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

export default SubscriptionExpiringEmail;

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

const warningBox = {
  backgroundColor: "#fff4e6",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  padding: "24px",
  margin: "24px 48px",
};

const warningText = {
  color: "#92400e",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const list = {
  padding: "0 48px 0 72px",
  margin: "16px 0",
};

const listItem = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "8px",
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
