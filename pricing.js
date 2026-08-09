//const for prices of tier of cover, extras and family cover
const HOSPITAL_PRICES = { None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220 };
const EXTRAS_PRICES = { None: 0, Basic: 25, Standard: 45, Premium: 70 };
const FAMILY_FEE = 30;

//LHC loading fun for calc on each applicant returned as decimal to use for calc
function calc_lhc_loading(age, cover_history, hospital_tier) {
    //if hospital cover is none
    if (hospital_tier === 'None') return 0;
    //cover history anything but no, loading doesn't apply
    if (cover_history !== 'No') return 0;
    //if age is less than or equal to 30, loading doesn't apply
    if (age <= 30) return 0;
    //formula for loading (age - 30) x 2% 
    return (age - 30) * 0.02;
}

//helper for not sure option warning
function check_warning(applicant_num, cover_history, warnings) {
    if (cover_history === 'Not sure') {
        warnings.push(`Applicant ${applicant_num}: Cover history is unknown, LHC loading has not been applied.`);
    }
}

//calc logic
function calculate_quote(quote) {
    const hospital_base = HOSPITAL_PRICES[quote.hospital_cover];
    const extras_base = EXTRAS_PRICES[quote.extras_cover];
 
    let hospital_total = 0;
    let extras_total = 0;
    let family_fee = 0;
    const applicant_loadings = [];
    const warnings = [];
 
    //single
    if (quote.cover_type === 'Single') {
        const loading1 = calc_lhc_loading(quote.applicant1_age, quote.applicant1_cover_history, quote.hospital_cover);
    
        hospital_total = hospital_base * (1 + loading1);
        extras_total = extras_base;
    
        applicant_loadings.push({applicant: 1, loading_percent: loading1 * 100});

        check_warning(1, quote.applicant1_cover_history, warnings);

    //couple and family
    } else {
        const loading1 = calc_lhc_loading(quote.applicant1_age, quote.applicant1_cover_history, quote.hospital_cover);
        const loading2 = calc_lhc_loading(quote.applicant2_age, quote.applicant2_cover_history, quote.hospital_cover);
    
        hospital_total = (hospital_base * (1 + loading1)) + (hospital_base * (1 + loading2));
        extras_total = extras_base * 2;
        if (quote.cover_type === 'Family') {
            family_fee = FAMILY_FEE;
        }
    
        applicant_loadings.push({applicant: 1, loading_percent: loading1 * 100});
        applicant_loadings.push({applicant: 2, loading_percent: loading2 * 100});

        check_warning(1, quote.applicant1_cover_history, warnings);
        check_warning(2, quote.applicant2_cover_history, warnings);
    }
    
    //calc monthly & yearly options
    const monthly_premium = hospital_total + extras_total + family_fee;
    const yearly_before_discount = monthly_premium * 12;
    
    //Monthly payment: show the monthly premium and the yearly premium before discount. The annual discount is not applied.
    //Yearly payment: show the monthly premium, the yearly premium before discount, and the yearly premium after the annual discount. 
    //yearly discount only calculated and displayed if yearly payment is sellected
    let yearly_after_discount = null;
    if (quote.payment_frequency === 'Yearly') {
        yearly_after_discount = yearly_before_discount * (1 - quote.annual_discount / 100);
    }
    
    const lhc_statement = 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.';
    
    return {
        hospital_total, extras_total, family_fee, applicant_loadings, monthly_premium, yearly_before_discount, yearly_after_discount, warnings, lhc_statement
    };
}
 
module.exports = {calculate_quote};