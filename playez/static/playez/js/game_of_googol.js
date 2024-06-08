var nums=Array(50).fill(5);
var max=Math.floor(Math.random()*10**6);
nums=nums.map(_e=>Math.floor(Math.random()*max));
console.log(Math.max(...nums));
var cards=document.getElementsByClassName("card");
var t_c=0;
for(var i=0;i<cards.length;i++){
    cards[i].addEventListener("click",e=>{
        if (t_c==parseInt(e.target.id.match(/\d+/g)[0])) {
            e.target.innerText=nums[t_c];
            t_c++;
        }
    })
}
var stp_btn=document.getElementById('stp-btn');
stp_btn.addEventListener("click",_e=>{
    console.log(nums[--t_c]);
    for(var i=0;i<cards.length;i++){
        cards[i].parentNode.replaceChild(cards[i].cloneNode(true),cards[i]);
    }
})

var xhr = new XMLHttpRequest();
xhr.open('POST', 'gamepi', true);
xhr.setRequestHeader('X-CSRFToken', csrf_token);
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
xhr.onload = function () {
    if (xhr.status === 200) {
        console.log(xhr.responseText);
    }
}
xhr.send("type=play_next&game_id=1");


