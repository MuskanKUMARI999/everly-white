import type { LegalSection } from "@/components/legal/LegalLayout";

const listClasses = "list-disc space-y-1.5 pl-5 marker:text-neutral-300";

export const privacyIntro = (
  <>
    Everly White studios is committed to protecting the privacy and security of our customers and
    visitors to our online store at www.everlywhite.com. This Privacy Policy describes how we collect
    your personal information, and how we may use or share it when you visit or make a purchase at
    www.everlywhite.com, or when you interact with us through digital communication channels or social
    media platforms.
  </>
);

export const privacySections: LegalSection[] = [
  {
    heading: "The Personal Information We Collect",
    body: (
      <p>
        When you visit www.everlywhite.com, we automatically collect certain information about the
        device you are shopping or browsing on, including information about your web browser, IP
        address, time zone, and some of the cookies that are installed on your device. When you are
        browsing www.everlywhite.com, we collect information about each individual page you view, what
        website or search terms referred you to the site, and information on your behaviour with the
        site.
      </p>
    ),
  },
  {
    heading: "How We Collect This Information",
    body: (
      <>
        <p>
          We collect this information using website cookies and similar technologies — small files or
          pieces of text that download to a device when a visitor accesses a website or app. These
          functional and required cookies allow our hosting platform to securely provide this website to
          you.
        </p>
        <p>
          Analytics and performance cookies are used on this site only when you acknowledge the cookie
          banner. We use analytics cookies to view site traffic, performance, behaviour, and other
          various data sources.
        </p>
      </>
    ),
  },
  {
    heading: "Customer Accounts",
    body: (
      <>
        <p>
          When creating a customer account with www.everlywhite.com, we collect personal information to
          improve our checkout experience and overall customer service. This includes, but is not limited
          to:
        </p>
        <ul className={listClasses}>
          <li>Your full name and last name</li>
          <li>Billing and shipping address(es)</li>
          <li>Details about your order</li>
          <li>Email address(es)</li>
          <li>Phone and/or mobile phone number</li>
        </ul>
        <p>We share this information with our hosting provider so they can provide certain web services to us.</p>
      </>
    ),
  },
  {
    heading: "Marketing & Advertising",
    body: (
      <p>
        When creating an account, you have the option to opt into receiving marketing materials from us.
        If you accept, you will receive marketing materials through email or through your web browser.
        You can unsubscribe at any time by clicking the unsubscribe link at the bottom of the email, or
        by adjusting your cookie preferences. We may share the information we&rsquo;ve gathered with our
        hosting or email marketing providers so they are able to send emails to you on our behalf.
      </p>
    ),
  },
  {
    heading: "Transactional & Notification Emails",
    body: (
      <>
        <p>
          When shopping online at www.everlywhite.com, we may send you emails about an order you placed,
          or changes to your account. This includes, but is not limited to:
        </p>
        <ul className={listClasses}>
          <li>Creating an online account</li>
          <li>Changing or updating your password</li>
          <li>Making a purchase online</li>
          <li>Your order has been shipped</li>
          <li>Your order has been delayed</li>
          <li>You have been unsubscribed</li>
          <li>You have closed your account</li>
        </ul>
      </>
    ),
  },
  {
    heading: "Website Visitors",
    body: (
      <>
        <p>
          When you make a purchase at www.everlywhite.com, we collect personal information to fulfil and
          ship your order. This includes, but is not limited to:
        </p>
        <ul className={listClasses}>
          <li>Billing and shipping address(es)</li>
          <li>Details relating to your purchase</li>
          <li>Email address(es)</li>
          <li>Full first name and last name</li>
          <li>Phone number and/or mobile number</li>
        </ul>
        <p>
          We share this information with our hosting provider so they can provide web services to us. As
          you go through checkout, this site may auto-complete your shipping and billing address by
          sharing what you type with a places/autocomplete API and returning suggestions to improve your
          checkout experience.
        </p>
      </>
    ),
  },
  {
    heading: "Changes To This Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or
        applicable law. We will notify you of any material changes to this Privacy Policy by posting the
        updated policy on our website or sending you a notification via SMS.
      </p>
    ),
  },
  {
    heading: "Contact Us",
    body: (
      <p>
        If you have any questions about the above, please contact{" "}
        <a
          href="mailto:info@everlywhite.com"
          className="text-brown underline decoration-pink-300 underline-offset-4"
        >
          info@everlywhite.com
        </a>
        .
      </p>
    ),
  },
];
