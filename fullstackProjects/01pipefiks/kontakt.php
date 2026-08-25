<?php
require_once("_topp.php");
?>
<style>
    nav {
        background-color: black;
    }
</style>

<article class="sentrerSide" style="margin-top: 50px;">
    <img src="Images/kontaktOss.jpg" alt="" style="float:left;width: 320px;">
    <form action="" method="post" style="float:left; width:500px; margin-left: 50px;">
  
        <p>Lurer du på noe?</p>
        <h1>Ta kontakt</h1>
        <p>Vi ser frem til å høre fra deg for en hyggelig og uforpliktende samtale. Vi står klare til å besvare eventuelle spørsmål eller diskutere dine behov. Du vil motta svar så snart som mulig.</p>
        Navn <br>
        <input type="text" placeholder="Ola Nordmann" style="width: 300px;"> <br>
        Epost <br>
        <input type="text" placeholder="eksempel@mail.no" style="width: 300px;"><br>
        Telefon <br>
        <input type="text" placeholder="+47 00 00 00 00" style="width: 300px;"><br>
        Emne <br>
        <input type="text" placeholder="Tittel" style="width: 400px;"><br>
        Melding <br>
        <textarea name="" id="" cols="30" rows="6" placeholder="Hva kan vi hjelpe deg med?" style="width: 400px;"></textarea>
        <input type="submit" value="Send melding">
        <p>Ved å sende inn dette skjemaet, bekrefter du selskapets personvern og retningslinjer.</p>
    </form>
</article>

<?php
require_once("_bunn.php");
?>