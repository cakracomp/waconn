const formatPhoneNumber = (phoneNumber) => {
    let formattedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = `62${formattedPhoneNumber.slice(1)}`;
    }
    return formattedPhoneNumber;
};

module.exports = { formatPhoneNumber };
