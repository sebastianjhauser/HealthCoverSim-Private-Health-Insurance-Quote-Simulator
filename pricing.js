//const for prices of tier of cover, extras and family cover
const HOSPITAL_PRICES = { None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220 };
const EXTRAS_PRICES = { None: 0, Basic: 25, Standard: 45, Premium: 70 };
const FAMILY_FEE = 30;

//LHC loading fun for calc on each applicant returned as decimal to use for calc
function calcLHCLoading(age, coverHistory, hospitalTier) {
    //if hospital cover is none
    if (hospitalTier === 'None') return 0;
    //cover history anything but no, loading doesn't apply
    if (coverHistory !== 'No') return 0;
    //if age is less than or equal to 30, loading doesn't apply
    if (age <= 30) return 0;
    //formula for loading (age - 30) x 2% 
    return (age - 30) * 0.02;
}

//helper for not sure option warning
function checkWarning(applicantNum, coverHistory, warnings) {
    if (coverHistory === 'Not sure') {
        warnings.push(`Applicant ${applicantNum}: Cover history is unknown - LHC loading has not been applied. This quote may be inaccurate.`);
    }
}

//calc logic
function calculateQuote(quote) {
    const hospitalBase = HOSPITAL_PRICES[quote.hospitalCover];
    const extrasBase = EXTRAS_PRICES[quote.extrasCover];
 
    let hospitalTotal = 0;
    let extrasTotal = 0;
    let familyFee = 0;
    const applicantLoadings = [];
    const warnings = [];
 
    //single
    if (quote.coverType === 'Single') {
        const loading1 = calcLHCLoading(quote.applicant1Age, quote.applicant1CoverHistory, quote.hospitalCover);
    
        hospitalTotal = hospitalBase * (1 + loading1);
        extrasTotal = extrasBase;
    
        applicantLoadings.push({applicant: 1, loadingPercent: loading1 * 100});

        checkWarning(1, quote.applicant1CoverHistory, warnings);

    //couple and family
    } else {
        const loading1 = calcLHCLoading(quote.applicant1Age, quote.applicant1CoverHistory, quote.hospitalCover);
        const loading2 = calcLHCLoading(quote.applicant2Age, quote.applicant2CoverHistory, quote.hospitalCover);
    
        hospitalTotal = (hospitalBase * (1 + loading1)) + (hospitalBase * (1 + loading2));
        extrasTotal = extrasBase * 2;
        if (quote.coverType === 'Family') {
            familyFee = FAMILY_FEE;
        }
    
        applicantLoadings.push({applicant: 1, loadingPercent: loading1 * 100});
        applicantLoadings.push({applicant: 2, loadingPercent: loading2 * 100});

        checkWarning(1, quote.applicant1CoverHistory, warnings);
        checkWarning(2, quote.applicant2CoverHistory, warnings);
    }
    
    //calc monthly & yearly options
    const monthlyPremium = hospitalTotal + extrasTotal + familyFee;
    const yearlyBeforeDiscount = monthlyPremium * 12;
    
    //Monthly payment: show the monthly premium and the yearly premium before discount. The annual discount is not applied.
    //Yearly payment: show the monthly premium, the yearly premium before discount, and the yearly premium after the annual discount. 
    //yearly discount only calculated and displayed if yearly payment is sellected
    let yearlyAfterDiscount = null;
    if (quote.paymentFrequency === 'Yearly') {
        yearlyAfterDiscount = yearlyBeforeDiscount * (1 - quote.annualDiscount / 100);
    }
    
    const lhcStatement = 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.';
    
    return {
        hospitalTotal, extrasTotal, familyFee, applicantLoadings, monthlyPremium, yearlyBeforeDiscount, yearlyAfterDiscount, warnings, lhcStatement
    };
}
 
module.exports = { calculateQuote };