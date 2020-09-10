let socket = io.connect('/');
var seatId;
var playerId;
var WAITING_TIME = 0;
var timer;
var currentTime;

function manageTimer(elem) {
    timer = setInterval(function () {
        currentTime = currentTime - 1;
        elem.find('.timer').text(currentTime)
    }, 1000)
}
$(".seat").find('a').click(function (e) {
    socket.emit('takeSeat', {
        seat: $(this).data("id")
    });
})
socket.on('playerInfo', function (data) {
    playerId = data.playerId;
    seatId = data.seat;
})
socket.on('takenSeat', function (data) {
    $(".seat").each(function () {
        if (typeof (playerId) !== 'undefined') {
            $(this).find('a').remove();
        }
        if ($(this).data('id') == data.seat) {
            $(this).find('a').remove();
            $(this).find('p.taken').show();
            $(this).find('.score').show();
        }

    });
});

socket.on('startGame', function (data) {
    $("div.gameInfo").text(data.str)
    WAITING_TIME = data.time
})
socket.on('turn', function (data) {
    clearInterval(timer);

    $("div.gameInfo").text('').fadeIn('slow');
    $(".seat").each(function () {

        if ($(this).data('id') == data.seat) {
            $(this).addClass('seatActive')
            currentTime = WAITING_TIME / 1000
            $(this).find('.timer').show().text(currentTime);
            manageTimer($(this));

        } else {
            $(this).find('.timer').hide();
            $(this).removeClass('seatActive')
            $(this).find('p.timer').text('').hide();
        }
        if (playerId == data.playerId && $(this).data('id') == data.seat) {
            $(this).find('.takeChance').show();

        } else {
            $(this).find('.takeChance').hide();

        }
    })
})

$(".takeChance").on('click', function (e) {
    socket.emit('playerTurn', {
        seat: $(this).closest('div.seat').data('id')
    })
})

socket.on("playerTurnValue", function (data) {
    console.log(data)
    $('.dice span').text(data.dice)
    $(".seat").each(function () {

        if ($(this).data('id') == data.seat) {
            $(this).find('p span').text(data.score);
        }
    })
})
socket.on('playerWinner', function (data) {
    $(".seat").each(function () {
        if ($(this).data('id') == data.seat) {
            $(this).removeClass('seatActive').addClass('winner');
            $(this).find('p.winnerText').show();
        }
        $(this).find('a').remove()
        $(this).find('p.taken').remove();
        $(this).find('.takeChance').remove();
        $(this).find('p.timer').remove();

    })
})
socket.on("fullSeat", function (data) {
    alert(data)
})