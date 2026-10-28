const getExplicitType = (enquiry) => enquiry.requestType || enquiry.type;

export const isBuildLandRequest = (enquiry) => {
  const explicitType = getExplicitType(enquiry);
  if (explicitType === "BuildRequest") return true;
  if (explicitType === "PropertyBooking") return false;

  const title = String(enquiry.propertyTitle || "").toLowerCase();
  const message = String(enquiry.message || "").toLowerCase();
  return (
    title.includes("build on your land") ||
    title.includes("build your dream home") ||
    message.startsWith("build on your land request") ||
    message.startsWith("build your dream home request")
  );
};

export const isPropertyEnquiry = (enquiry) => {
  if (isBuildLandRequest(enquiry)) return false;
  return getExplicitType(enquiry) !== "BuildRequest";
};
