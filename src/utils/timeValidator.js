const validateTimerInSeconds = (timer) => {
    const regex = /^[0-9]+s$/;

    if (!regex.test(timer)) {
        return {
            validT: false,
            tMessage: "Timer must be in seconds format like 10s",
        };
    }

    return { validT: true };
};

module.exports =  validateTimerInSeconds ;
