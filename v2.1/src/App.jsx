import logo from ''; /*add the path to my logo*/

function header() {
  return(
    <>
      <header>
        <img src={logo} alt="Logo" className="logo"/>
      </header>
    </>
  )
}

export default header;