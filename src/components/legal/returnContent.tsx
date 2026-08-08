import type { LegalSection } from "@/components/legal/LegalLayout";

const mailto = (
  <a
    href="mailto:info@everlywhite.com"
    className="text-brown underline decoration-pink-300 underline-offset-4"
  >
    info@everlywhite.com
  </a>
);

export const returnIntro = (
  <>
    Considering the time and effort that goes into the production of each item, Everly White studios
    does not provide the option to refund or exchange a product once purchased. Exact sizing and details
    are listed in every product description to avoid the need for exchange, so please check images and
    read the description carefully before purchasing. Every item is also checked by our quality team to
    ensure it has no defects.
  </>
);

export const returnSections: LegalSection[] = [
  {
    heading: "Manufacturing Defects & Damaged Items",
    body: (
      <>
        <p>
          In case of any manufacturing defect, damaged item in transit, or missing item in your order,
          you can register a complaint within 24 hours of delivery by sending us an email at {mailto}.
        </p>
        <p>
          To be eligible for a refund or replacement, you are required to record a video of opening the
          package to prove that you received an already defective or missing product. Please share your
          order number along with the unboxing video.
        </p>
      </>
    ),
  },
  {
    heading: "Complaint Resolution",
    body: (
      <p>
        Our team will respond to your complaint within 2–5 working days and get in touch via email or
        call. If you are eligible for a refund or replacement, we will communicate the necessary next
        steps with you.
      </p>
    ),
  },
  {
    heading: "Wrong Delivery Status",
    body: (
      <p>
        In case the delivery status shows &ldquo;delivered&rdquo; and you have not received the product,
        you need to inform us within 24 hours. Please send an email with your order ID and the subject
        &ldquo;Wrong Delivery Status&rdquo; to {mailto}. Failing to do so within 24 hours does not entitle
        you to any refund or support from our team.
      </p>
    ),
  },
  {
    heading: "Returns Due To Customer Error (RTO)",
    body: (
      <p>
        If a shipment is returned due to a mistake or negligence on the customer&rsquo;s part — such as
        providing an incorrect or incomplete address, incorrect contact information, failing to answer
        calls from the courier or from Everly White studios, or not being available to accept delivery —
        the customer is responsible for the RTO (return) charges and reshipment charges of the parcel.
        Cancellation of the order will not be entertained in these cases.
      </p>
    ),
  },
  {
    heading: "Contact Us",
    body: (
      <p>
        If you do not receive a refund amount within the communicated time frame, please check your bank
        account again or contact your bank, as processing may take some time on their end. For any other
        queries, you can contact us at {mailto}.
      </p>
    ),
  },
];
