//base prices
const HOSPITAL_PRICES = {None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220};
const EXTRAS_PRICES = {None: 0, Basic: 25, Standard: 45, Premium: 70};
const FAMILY_FEE = 30;
const LHC_STATEMENT = 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.';

//mandatory warning if cover history is unknown
function checkWarning(applicant_number, cover_history) {
    if (cover_history === "Not sure") {
        return `Applicant ${applicant_number}: Cover history is unknown - LHC loading has not been applied. This quote may be inaccurate.`;
    }
    return null;
}

function calculateApplicant(applicant_number, age, cover_history, hospital_tier, hospital_tier_price) {
    //none has no premium or LHC
    if (hospital_tier === "None") {
        return {applicant_number, loading_percent: 0, hospital_premium: 0, warning: null};
    }
    //LHC logic
    let loading_percent = 0;
    if (cover_history === "No" && age > 30) {
        loading_percent = (age - 30) * 2;
    }
    const hospital_premium = hospital_tier_price * (1 + loading_percent / 100);

    return {applicant_number, loading_percent, hospital_premium, warning: checkWarning(applicant_number, cover_history)};
}

function calculateQuote(quote) {
    const hospital_tier_price = HOSPITAL_PRICES[quote.hospital_cover];
    const extras_tier_price = EXTRAS_PRICES[quote.extras_cover];

    const applicants = [];
    if (quote.cover_type === "Single") {
        applicants.push(calculateApplicant(1, quote.applicant1_age, quote.applicant1_cover_history, quote.hospital_cover, hospital_tier_price));
    } else {
        applicants.push(calculateApplicant(1, quote.applicant1_age, quote.applicant1_cover_history, quote.hospital_cover, hospital_tier_price));
        applicants.push(calculateApplicant(2, quote.applicant2_age, quote.applicant2_cover_history, quote.hospital_cover, hospital_tier_price));
    }

    let hospital_total = 0;
    const warnings = [];
    //collect warnings from LHC
    for (const a of applicants) {
        hospital_total += a.hospital_premium;
        if (a.warning) {
            warnings.push(a.warning);
        }
    }

    //extras per adult
    let adult_count;
    if (quote.cover_type === "Single") {
        adult_count = 1;
    } else {
        adult_count = 2;
    }
    const extras_total = extras_tier_price * adult_count;

    //family fee
    let family_fee;
    if (quote.cover_type === "Family") {
        family_fee = FAMILY_FEE;
    } else {
        family_fee = 0;
    }

    //monthly premium & yearly before discount
    const monthly_premium = hospital_total + extras_total + family_fee;
    const yearly_before_discount = monthly_premium * 12;

    //yearly after discount
    let yearly_after_discount = null;
    if (quote.payment_frequency === "Yearly") {
        yearly_after_discount = yearly_before_discount * (1 - quote.annual_discount / 100);
    }

    const applicant_loadings = [];
    for (const a of applicants) {
        applicant_loadings.push({applicant_number: a.applicant_number, loading_percent: a.loading_percent});
    }

    return {
        hospital_total,
        extras_total,
        family_fee,
        monthly_premium,
        yearly_before_discount,
        yearly_after_discount,
        applicant_loadings,
        warnings,
        lhc_statement: LHC_STATEMENT
    };
}

module.exports = {calculateQuote};