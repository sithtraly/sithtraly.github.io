
var token = undefined
const headers = { "Accept": 'application/json' }
const userLostMode = []

document.addEventListener('DOMContentLoaded', function () {
    const tmp = localStorage.getItem('token')
    if (tmp) {
        token = tmp
        headers.authorization = token
        hideElement('#token-section')
        showElement('#work-section')
        setTimeout(() => {
            getUserWinLose()
            getUserLoseMode()
        }, 500)

        setInterval(() => {
            getUserWinLose()
        }, 1000 * 60 * 4)
    } else {
        showElement('#token-section')
        hideElement('#work-section')
    }

    const storedAmount = localStorage.getItem('amount')
    if (storedAmount) {
        const amount = JSON.parse(storedAmount)
        document.getElementById('add-to-lose').value = amount.toAdd || 150000
        document.getElementById('remove-from-lose').value = amount.toRemove || 100000
    }

    document.getElementById('add-to-lose').addEventListener('change', () => {
        const data = JSON.parse(localStorage.getItem('amount') || '{}')
        data.toAdd = parseInt(document.getElementById('add-to-lose').value)
        localStorage.setItem('amount', JSON.stringify(data))
    })
    document.getElementById('remove-from-lose').addEventListener('change', () => {
        const data = JSON.parse(localStorage.getItem('amount') || '{}')
        data.toRemove = parseInt(document.getElementById('remove-from-lose').value)
        localStorage.setItem('amount', JSON.stringify(data))
    })
})
window.addEventListener('scroll', () => {
    const btnScroll = document.querySelector('button.scroll-top')
    const y = window.scrollY
    if (y > 0) {
        btnScroll.style.display = 'unset'
    } else {
        btnScroll.style.display = 'none'
    }
})
function scrollToTopPage() {
    window.scroll(0, 0)
}
function showLoading(isShow = true) {
    if (isShow) {
        document.querySelector('#loading').style.display = 'flex'
    } else {
        document.querySelector('#loading').style.display = 'none'
    }
}
function hideElement(el) {
    document.querySelectorAll(el).forEach(e => {
        e.style.display = 'none'
    })
}
function showElement(el, dp = 'block') {
    document.querySelectorAll(el).forEach(e => {
        e.style.display = dp
    })
}

function getUserWinLose() {
    const uri = 'https://api4.lotto90khmer.com/adm/admin_report/admin_report_winlost?isProgressing=false&page=1&size=10&sort=DESC&sortFieldName=todayWinLost'
    fetchData(uri, { headers }).then(res => {
        const data = res.data.sort((a, b) => {
            if (parseInt(a.todayWinLost) < parseInt(b.todayWinLost)) {
                return 1
            }
            if (parseInt(a.todayWinLost) > parseInt(b.todayWinLost)) {
                return -1
            }
            return 0
        })
        const temp = []
        const winAmount2remove = parseInt(document.getElementById('add-to-lose').value)
        for (const a of userLostMode) {
            const user = data.find(item => item.username == a)
            if (user && user.todayWinLost < winAmount2remove) {
                userMode(user.username, 'lose', false)
                temp.push(user.username)
            }
        }
        if (temp.length > 0) {
            for (const i of temp) {
                const idx = userLostMode.indexOf(i)
                userLostMode.splice(idx, 1)
            }
        }
        const winAmount2Add = parseInt(document.getElementById('add-to-lose').value)
        for (const d of data) {
            if (d.todayWinLost < winAmount2Add) {
                break
            }
            const user = d.username
            if (d.todayWinLost >= winAmount2Add && !userLostMode.includes(user)) {
                userLostMode.push(user)
                userMode(user, 'lose', true)
            }
        }
        document.querySelector('#table-win-lose tbody').innerText = ''
        let totalTurn = 0
        let totalWinLose = 0
        data.forEach(d => {
            totalTurn += d.turn
            totalWinLose += d.todayWinLost
            const lose = d.todayWinLost
            const tr = document.createElement('tr')
            if (lose < 0) {
                tr.classList.add('lose')
            }
            tr.innerHTML = `<td>${d.userId}</td>\
                            <td>${d.username}</td>\
                            <td class="credit">${d.turn.toLocaleString()}</td>\
                            <td class="credit today-win-lose">${d.todayWinLost.toLocaleString()}</td>\
                            <td class="credit">${d.maxBetOn.toLocaleString()}</td>\
                            <td>\
                                <span class="icon" onclick="userMode('${d.username}', 'lose', true, true)">arrow_downward</span>\
                                <span class="icon" onclick="userMode('${d.username}', 'win', true, true)">arrow_upward</span>\
                                ${d.isWinMood ? `<span class="icon" style="color:gold" onclick="userMode('${d.username}', 'win', false, true)">star</span>` : ''}\
                            </td>`
            document.querySelector('#table-win-lose tbody').append(tr)
        })
        const tr = document.createElement('tr')
        tr.innerHTML = `<td></td>\
                        <td style="text-align: right">Total:</td>\
                        <td class="credit">${totalTurn.toLocaleString()}</td>\
                        <td class="credit">${totalWinLose.toLocaleString()}</td>\
                        <td></td>\
                        <td></td>`
        document.querySelector('#table-win-lose tbody').append(tr)
    })
}

function userMode(username, mode = 'lose', isTrue = true, isRefresh = false) {
    let uri = `https://api4.lotto90khmer.com/adm/users/set_player_lost?username=${username}&isLost=${isTrue}`
    if (mode == 'win') {
        uri = `https://api4.lotto90khmer.com/adm/users/set_player_win?username=${username}&isWin=${isTrue}`
    }
    const idx = userLostMode.indexOf(username)
    userLostMode.splice(idx, 1)
    fetchData(uri, { headers, method: 'PUT' }).then(res => {
        getUserLoseMode()
        if (isRefresh) {
            getUserWinLose()
        }
    })
}

function getUserLoseMode() {
    const url = 'https://api4.lotto90khmer.com/adm/users/all_members?isLost=true&activate=true&page=1&size=10'
    fetchData(url, { headers }).then(res => {
        document.querySelector('#table-lose-mode tbody').innerText = ''
        const data = res.data
        data.forEach(d => {
            const tr = document.createElement('tr')
            const t = new Date(d.creationDate)
            tr.innerHTML = `<td>${d.id}</td>\
                            <td>${d.name}</td>\
                            <td>${d.username}</td>\
                            <td>${t.getFullYear()}/${(t.getMonth() + 1).toString().padStart(2, '0')}/${t.getDate().toString().padStart(2, '0')} ${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds()}</td>\
                            <td class="credit">${d.credit.toLocaleString()}</td>\
                            <td>\
                                <span class="icon" onclick="userMode('${d.username}', 'lose', false)">arrow_right_alt</span>\
                            </td>`
            document.querySelector('#table-lose-mode tbody').append(tr)
            if (!userLostMode.includes(d.username)) {
                userLostMode.push(d.username)
            }
        })
    })
}

function clearUserLoseMode() {
    for (const u of userLostMode) {
        userMode(u, 'lose', false)
    }
}

function snakbar(message) {
    const div = document.createElement('div')
    div.innerText = message
    div.classList.add('snackbar', 'snackbar-in')
    document.body.appendChild(div)
    setTimeout(() => {
        if (div != undefined) {
            div.classList.remove('snackbar-in')
            div.classList.add('snackbar-out')
            setTimeout(() => {
                div.remove()
            }, 500)
        }
    }, 2000)
}

function login(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const pass = form.get('pass')
    console.log(pass)
    if (!pass) {
        snakbar('Password require')
        return
    }
    const url = 'https://api4.lotto90khmer.com/adm/login?grant_type=password&username=admin&password=' + pass
    const data = { client_id: "client-mobile", client_secret: "123", }
    const headers = { 'authorization': 'Basic Y2xpZW50LW1vYmlsZToxMjM=', Accept: 'application/json' }
    fetchData(url, { headers, data }).then(res => {
        const data = res
        localStorage.setItem('token', `${data.token_type} ${data.access_token}`)
        location.reload()
    }).catch(err => snakbar('Password incorrect'))
}

async function fetchData(url, { method = 'GET', headers = {}, data = {} }) {
    showLoading(true)
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Accept": 'application/json',
            ...headers
        },
    }
    if (method !== 'GET') {
        options.body = typeof data == 'string' ? data : JSON.stringify(data)
    }
    const res = await fetch(url, options)
    if ([401, 403].includes(res.status)) {
        localStorage.removeItem('token')
        location.reload()
    }
    const resData = await res.json()
    showLoading(false)
    return resData
}