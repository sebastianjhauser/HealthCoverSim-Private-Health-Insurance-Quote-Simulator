const HOSPITAL_PRICES = {None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220};
const EXTRAS_PRICES = {None: 0, Basic: 25, Standard: 45, Premium: 70};
const FAMILY_FEE = 30;
const LHC_STATEMENT = 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.';

function checkWarning(label, coverHistory) {
    if (coverHistory === "Not sure") {
        return `${label}: Cover history is unknown. LHC loading has not been applied.`;
    }
    return null;
}

function calculateApplicant(label, age, coverHistory, hospitalTier, hospitalTierPrice) {
    // Checked by tier name, not by price === 0, so a future $0 tier (e.g. a promo)
    // doesn't accidentally get treated as "no cover".
    // Warning is still checked even with no hospital cover, matching original behavior:
    // an unknown cover history is worth flagging regardless of the tier chosen.
    if (hospitalTier === "None") {
        return {label, loadingPercentage: 0, hospitalPremium: 0, warning: checkWarning(label, coverHistory)};
    }

    let loadingPercentage = 0;
    if (coverHistory === "No" && age > 30) {
        loadingPercentage = (age - 30) * 2;
    }

    const hospitalPremium = hospitalTierPrice * (1 + loadingPercentage / 100);
    return {label, loadingPercentage, hospitalPremium, warning: checkWarning(label, coverHistory)};
}

function calculateQuote(quote) {
    const hospitalTierPrice = HOSPITAL_PRICES[quote.hospitalCover];
    const extrasTierPrice = EXTRAS_PRICES[quote.extrasCover];

    const applicants = [];
    if (quote.coverType === "Single") {
        applicants.push(calculateApplicant("Applicant 1", quote.applicant1Age, quote.applicant1CoverHistory, quote.hospitalCover, hospitalTierPrice));
    } else {
        applicants.push(calculateApplicant("Applicant 1", quote.applicant1Age, quote.applicant1CoverHistory, quote.hospitalCover, hospitalTierPrice));
        applicants.push(calculateApplicant("Applicant 2", quote.applicant2Age, quote.applicant2CoverHistory, quote.hospitalCover, hospitalTierPrice));
    }

    let hospitalTotal = 0;
    const warnings = [];
    for (const a of applicants) {
        hospitalTotal += a.hospitalPremium;
        if (a.warning) warnings.push(a.warning);
    }

    const adultCount = quote.coverType === "Single" ? 1 : 2;
    const extrasTotal = extrasTierPrice * adultCount;
    const familyFee = quote.coverType === "Family" ? FAMILY_FEE : 0;

    const monthlyPremium = hospitalTotal + extrasTotal + familyFee;
    const yearlyBeforeDiscount = monthlyPremium * 12;

    let yearlyAfterDiscount = null;
    if (quote.paymentFrequency === "Yearly") {
        yearlyAfterDiscount = yearlyBeforeDiscount * (1 - quote.annualDiscount / 100);
    }

    return {
        hospitalTotal,
        extrasTotal,
        familyFee,
        monthlyPremium,
        yearlyBeforeDiscount,
        yearlyAfterDiscount,
        applicantLoadings: applicants.map(({label, loadingPercentage}) => ({label, loadingPercentage})),
        warnings,
        lhcStatement: LHC_STATEMENT
    };
}

module.exports = {calculateQuote};