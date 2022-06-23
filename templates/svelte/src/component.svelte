<script></script>

<h1>
  <div>THIS COMPONENT</div>
  <div>CAN BE USED IN</div>
  <div class="brand">
    <ul>
      <li>REACT</li>
      <li>VUE</li>
      <li>HFZ</li>
      <li>ANGULAR</li>
      <li>SVELTE</li>
    </ul>
  </div>
</h1>

<style>
  h1 {
    line-height: 48px;
    font-family: tahoma;
  }

  .brand {
    color: #fff;
    overflow: hidden;
    position: relative;
  }

  .brand::after {
    content: "\00a0";
  }

  .brand ul {
    margin: 0;
    padding-left: 0.2rem;
    list-style: none;
    position: absolute;
    background-color: #5b7b65;
    animation: sliding 9s ease-in-out infinite;
  }

  @keyframes sliding {
    0% {
      width: 0;
    }
    4% {
      width: 0;
    }
    8% {
      width: 126px;
    }
    16% {
      width: 126px;
    }
    20% {
      top: 0;
      width: 0;
    }
    24% {
      top: -48px;
      width: 0;
    }
    28% {
      width: 85px;
    }
    36% {
      width: 85px;
    }
    40% {
      top: -48px;
      width: 0;
    }
    44% {
      top: -96px;
      width: 0;
    }
    48% {
      width: 85px;
    }
    56% {
      width: 85px;
    }
    60% {
      top: -96px;
      width: 0;
    }
    64% {
      top: -144px;
      width: 0;
    }
    68% {
      width: 172px;
    }
    76% {
      width: 172px;
    }
    80% {
      top: -144px;
      width: 0;
    }
    84% {
      top: -192px;
      width: 0;
    }
    88% {
      width: 140px;
    }
    96% {
      width: 140px;
    }
    100% {
      top: -192px;
      width: 0;
    }
  }
</style>
