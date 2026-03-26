function Toast({ msg, visible }) {
  return (
    <div style={{ position:"fixed", bottom:60, left:"50%", transform:"translateX(-50%)", background:"#2B9CB8", color:"#fff", padding:"7px 18px", borderRadius:4, fontSize:12, fontFamily:"Segoe UI,Calibri,sans-serif", fontWeight:600, boxShadow:"0 2px 8px rgba(0,0,0,0.2)", opacity:visible?1:0, transition:"opacity .3s", pointerEvents:"none", zIndex:2000 }}>
      {msg}
    </div>
  );
}

export default Toast;